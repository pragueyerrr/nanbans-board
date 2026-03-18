import { NextRequest, NextResponse } from 'next/server'
import { scrapeAllSources } from '@/lib/scrapers'

export const maxDuration = 60 // Vercel function max duration (seconds)

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const force = body?.force === true
  try {
    const result = await scrapeAllSources(force)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('Scrape error:', err)
    return NextResponse.json(
      { error: 'Scrape failed', detail: String(err) },
      { status: 500 }
    )
  }
}
