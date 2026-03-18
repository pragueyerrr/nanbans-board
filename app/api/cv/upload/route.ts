import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { parseCVWithClaude } from '@/lib/ai/generator'
import { setCached, cacheKeys, CACHE_TTL } from '@/lib/redis'

export const maxDuration = 60

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('cv_profiles')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ cv: data ?? null })
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const manualText = formData.get('text') as string | null

  let rawText = manualText ?? ''

  if (file) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name.toLowerCase()

    if (fileName.endsWith('.pdf')) {
      const pdfParse = (await import('pdf-parse')).default
      const parsed = await pdfParse(buffer)
      rawText = parsed.text
    } else if (
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc')
    ) {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      rawText = result.value
    } else if (fileName.endsWith('.txt')) {
      rawText = buffer.toString('utf-8')
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Use PDF, DOCX, or TXT.' },
        { status: 400 }
      )
    }
  }

  if (!rawText.trim()) {
    return NextResponse.json({ error: 'No text content found' }, { status: 400 })
  }

  // Parse CV with Claude
  const parsed_data = await parseCVWithClaude(rawText)

  // Extract contact info from parsed data or form fields
  const name =
    (formData.get('name') as string) ?? undefined
  const email =
    (formData.get('email') as string) ?? undefined
  const phone =
    (formData.get('phone') as string) ?? undefined
  const location =
    (formData.get('location') as string) ?? undefined
  const website =
    (formData.get('website') as string) ?? undefined
  const linkedin =
    (formData.get('linkedin') as string) ?? undefined
  const portfolio =
    (formData.get('portfolio') as string) ?? undefined

  const supabase = createAdminClient()

  // Upsert (we only keep one CV profile)
  const { data: existing } = await supabase
    .from('cv_profiles')
    .select('id')
    .limit(1)
    .single()

  const cvData = {
    name: name || undefined,
    email: email || undefined,
    phone: phone || undefined,
    location: location || undefined,
    website: website || undefined,
    linkedin: linkedin || undefined,
    portfolio: portfolio || undefined,
    raw_text: rawText,
    parsed_data,
  }

  let cv
  if (existing?.id) {
    const { data, error } = await supabase
      .from('cv_profiles')
      .update(cvData)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    cv = data
  } else {
    const { data, error } = await supabase
      .from('cv_profiles')
      .insert(cvData)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    cv = data
  }

  // Cache the CV
  await setCached(cacheKeys.cvProfile(), cv, CACHE_TTL.CV_PARSED)

  return NextResponse.json({ cv, success: true })
}
