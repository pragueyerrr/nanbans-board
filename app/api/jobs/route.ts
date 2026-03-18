import { NextRequest, NextResponse } from 'next/server'
import { getJobs } from '@/lib/scrapers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10)
  const search = searchParams.get('search') ?? ''

  try {
    const result = await getJobs(page, Math.min(pageSize, 50), search)
    return NextResponse.json(result)
  } catch (err) {
    console.error('GET /api/jobs error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}
