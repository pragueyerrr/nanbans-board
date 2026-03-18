import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import type { ApplicationStatus } from '@/types'

interface Params {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await request.json()
  const {
    status,
    notes,
    match_score,
    resume_latex,
    cover_letter_text,
    applied_at,
  } = body as {
    status?: ApplicationStatus
    notes?: string
    match_score?: number
    resume_latex?: string
    cover_letter_text?: string
    applied_at?: string
  }

  const supabase = createAdminClient()

  // Build update object with only provided fields
  const updates: Record<string, unknown> = {}
  if (status !== undefined) updates.status = status
  if (notes !== undefined) updates.notes = notes
  if (match_score !== undefined) updates.match_score = match_score
  if (resume_latex !== undefined) updates.resume_latex = resume_latex
  if (cover_letter_text !== undefined) updates.cover_letter_text = cover_letter_text
  if (applied_at !== undefined) updates.applied_at = applied_at

  // Auto-set applied_at when transitioning to 'applied'
  if (status === 'applied' && !applied_at) {
    updates.applied_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('applications')
    .update(updates)
    .eq('id', id)
    .select('*, job:jobs(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ application: data })
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = createAdminClient()

  const { error } = await supabase.from('applications').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
