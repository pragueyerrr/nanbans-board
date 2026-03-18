import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { generateResumeData, generateCoverLetterStream } from '@/lib/ai/generator'
import { generateLatexResume } from '@/lib/latex/templates'
import type { Job, CVProfile, ResumeData } from '@/types'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { job_id, type = 'resume', force = false } = body as {
    job_id: string
    type?: 'resume' | 'cover_letter'
    force?: boolean
  }

  if (!job_id) {
    return NextResponse.json({ error: 'job_id is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Fetch job, CV, and existing application in parallel
  const [jobRes, cvRes, appRes] = await Promise.all([
    supabase.from('jobs').select('*').eq('id', job_id).single(),
    supabase
      .from('cv_profiles')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('applications')
      .select('resume_data, resume_latex, cover_letter_text')
      .eq('job_id', job_id)
      .maybeSingle(),
  ])

  if (jobRes.error || !jobRes.data) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }
  if (cvRes.error || !cvRes.data) {
    return NextResponse.json(
      { error: 'No CV uploaded. Please upload your CV first.' },
      { status: 400 }
    )
  }

  const job = jobRes.data as Job
  const cv = cvRes.data as CVProfile
  const existing = appRes.data

  if (type === 'cover_letter') {
    // Return cached cover letter without hitting Claude
    if (!force && existing?.cover_letter_text) {
      const cached = existing.cover_letter_text as string
      const encoder = new TextEncoder()
      const readableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(cached))
          controller.close()
        },
      })
      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Cached': 'true',
        },
      })
    }

    // Stream fresh cover letter from Claude
    const stream = await generateCoverLetterStream(job, cv)
    const encoder = new TextEncoder()
    let coverLetterText = ''

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const text = event.delta.text
            coverLetterText += text
            controller.enqueue(encoder.encode(text))
          }
        }
        controller.close()

        await supabase
          .from('applications')
          .update({ cover_letter_text: coverLetterText })
          .eq('job_id', job_id)
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  }

  // Resume: return cached if available
  if (!force && existing?.resume_data) {
    const resumeData = existing.resume_data as ResumeData
    const latexSource = existing.resume_latex ?? generateLatexResume(resumeData)
    return NextResponse.json({ resumeData, latexSource, success: true, cached: true })
  }

  // Generate fresh resume
  const resumeData = await generateResumeData(job, cv)
  const latexSource = generateLatexResume(resumeData)

  await supabase
    .from('applications')
    .update({ resume_data: resumeData, resume_latex: latexSource })
    .eq('job_id', job_id)

  return NextResponse.json({ resumeData, latexSource, success: true })
}
