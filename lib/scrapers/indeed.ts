import { XMLParser } from 'fast-xml-parser'
import type { Job, JobSource } from '@/types'

const INDEED_RSS_QUERIES = [
  // Leadership & strategy
  { q: 'creative+director', label: 'Creative Director' },
  { q: 'art+director', label: 'Art Director' },
  { q: 'design+director', label: 'Design Director' },
  { q: 'creative+strategist', label: 'Creative Strategist' },
  { q: 'brand+manager', label: 'Brand Manager' },
  // Design
  { q: 'graphic+designer', label: 'Graphic Designer' },
  { q: 'visual+designer', label: 'Visual Designer' },
  { q: 'UX+UI+designer', label: 'UX/UI Designer' },
  { q: 'motion+graphics+designer', label: 'Motion Graphics' },
  { q: 'animator', label: 'Animator' },
  { q: 'illustrator', label: 'Illustrator' },
  { q: '3D+designer', label: '3D Designer' },
  { q: 'web+designer', label: 'Web Designer' },
  // Content & copy
  { q: 'content+creator', label: 'Content Creator' },
  { q: 'content+writer', label: 'Content Writer' },
  { q: 'copywriter', label: 'Copywriter' },
  { q: 'scriptwriter', label: 'Scriptwriter' },
  // Video & photo
  { q: 'video+editor', label: 'Video Editor' },
  { q: 'videographer', label: 'Videographer' },
  { q: 'photographer', label: 'Photographer' },
  // Social & digital
  { q: 'social+media+manager', label: 'Social Media Manager' },
  { q: 'social+media+creative', label: 'Social Media Creative' },
  { q: 'influencer+marketing', label: 'Influencer Marketing' },
  // Production
  { q: 'creative+producer', label: 'Creative Producer' },
  { q: 'content+producer', label: 'Content Producer' },
]

interface RSSItem {
  title: string
  link: string
  description?: string
  pubDate?: string
  source?: { '#text'?: string; _name?: string }
  guid?: string | { '#text': string }
}

interface RSSFeed {
  rss?: { channel?: { item?: RSSItem | RSSItem[] } }
}

async function fetchIndeedRSS(q: string): Promise<RSSItem[]> {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '_' })
  const url = `https://www.indeed.com/rss?q=${q}&l=Dubai%2C+UAE&radius=25&sort=date`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobAggregator/1.0; personal use)' },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return []
  const xml = await res.text()
  const feed: RSSFeed = parser.parse(xml)
  const items = feed.rss?.channel?.item
  return Array.isArray(items) ? items : items ? [items] : []
}

export async function scrapeIndeedRSS(): Promise<Omit<Job, 'id' | 'scraped_at'>[]> {
  const allJobs: Omit<Job, 'id' | 'scraped_at'>[] = []
  const seen = new Set<string>()

  // Run all queries in parallel batches of 5
  for (let i = 0; i < INDEED_RSS_QUERIES.length; i += 5) {
    const batch = INDEED_RSS_QUERIES.slice(i, i + 5)
    const settled = await Promise.allSettled(batch.map(({ q }) => fetchIndeedRSS(q)))

    for (const result of settled) {
      if (result.status !== 'fulfilled') continue
      for (const item of result.value) {
        const link = typeof item.link === 'string' ? item.link : String(item.link ?? '')
        const guid = typeof item.guid === 'string' ? item.guid : item.guid?.['#text'] ?? link

        if (seen.has(guid)) continue
        seen.add(guid)

        const rawDesc = item.description ?? ''
        const description = rawDesc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

        const titleParts = (item.title ?? '').split(' - ')
        const title = titleParts[0]?.trim() ?? item.title
        const company =
          titleParts.length > 1 ? titleParts[titleParts.length - 1]?.trim() : undefined

        allJobs.push({
          external_id: guid,
          source: 'indeed_rss' as JobSource,
          title,
          company,
          location: 'Dubai, UAE',
          description,
          job_url: link,
          posted_at: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
          is_active: true,
        })
      }
    }
  }

  return allJobs
}
