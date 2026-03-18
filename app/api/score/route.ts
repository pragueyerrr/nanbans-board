import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { scoreJob } from '@/lib/ai/scorer'
import { getCached, setCached, cacheKeys, CACHE_TTL } from '@/lib/redis'
import type { Job, CVProfile, JobScore } from '@/types'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { job_id } = body as { job_id: string }

  if (!job_id) {
    return NextResponse.json({ error: 'job_id is required' }, { status: 400 })
  }

  // Check cache
  const cacheKey = cacheKeys.jobScore(job_id)
  const cached = await getCached<JobScore>(cacheKey)
  if (cached) {
    return NextResponse.json({ score: cached, cached: true })
  }

  const supabase = createAdminClient()

  const [jobRes, cvRes] = await Promise.all([
    supabase.from('jobs').select('*').eq('id', job_id).single(),
    supabase
      .from('cv_profiles')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  if (jobRes.error || !jobRes.data) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }
  if (cvRes.error || !cvRes.data) {
    return NextResponse.json(
      { error: 'No CV found. Please upload your CV first.' },
      { status: 400 }
    )
  }

  const score = await scoreJob(jobRes.data as Job, cvRes.data as CVProfile)

  // Cache score and also update the application record if it exists
  await Promise.all([
    setCached(cacheKey, score, CACHE_TTL.SCORE),
    supabase
      .from('applications')
      .update({ match_score: score.total })
      .eq('job_id', job_id),
  ])

  return NextResponse.json({ score, cached: false })
}
