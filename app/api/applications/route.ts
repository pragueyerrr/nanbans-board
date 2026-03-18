import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import type { ApplicationStatus } from '@/types'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('applications')
    .select('*, job:jobs(*)')
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ applications: data })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { job_id, status = 'saved' } = body as {
    job_id: string
    status?: ApplicationStatus
  }

  if (!job_id) {
    return NextResponse.json({ error: 'job_id is required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('applications')
    .insert({ job_id, status })
    .select('*, job:jobs(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ application: data }, { status: 201 })
}
