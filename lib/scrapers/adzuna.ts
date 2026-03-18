import type { Job, JobSource } from '@/types'

const ADZUNA_BASE = 'https://api.adzuna.com/v1/api/jobs/ae/search'

const CREATIVE_CATEGORIES = [
  // Core creative roles
  'creative director',
  'art director',
  'design director',
  'creative lead',
  'creative manager',
  // Design
  'graphic designer',
  'brand designer',
  'visual designer',
  'digital designer',
  'web designer',
  'UI designer',
  'UX designer',
  'product designer',
  'motion graphics',
  'animator',
  'illustrator',
  '3D designer',
  // Content & copy
  'content creator',
  'content writer',
  'copywriter',
  'creative writer',
  'scriptwriter',
  // Video & photo
  'video editor',
  'videographer',
  'photographer',
  'cinematographer',
  'creative producer',
  // Social & digital marketing
  'social media manager',
  'social media creative',
  'influencer marketing',
  'digital marketing creative',
  // Strategy & brand
  'brand manager',
  'creative strategist',
  'content strategist',
  // Advertising
  'advertising creative',
  'creative account manager',
]

interface AdzunaResult {
  id: string
  title: string
  company: { display_name: string }
  location: { display_name: string }
  description: string
  redirect_url: string
  salary_min?: number
  salary_max?: number
  contract_time?: string
  created: string
}

interface AdzunaResponse {
  results: AdzunaResult[]
  count: number
}

async function fetchAdzunaTerm(
  term: string,
  appId: string,
  appKey: string
): Promise<AdzunaResult[]> {
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: '20',
    what: term,
    where: 'dubai',
    'content-type': 'application/json',
  })
  const res = await fetch(`${ADZUNA_BASE}/1?${params}`, {
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) return []
  const data: AdzunaResponse = await res.json()
  return data.results ?? []
}

async function runInBatches<T>(
  items: string[],
  batchSize: number,
  fn: (item: string) => Promise<T[]>
): Promise<T[]> {
  const results: T[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const settled = await Promise.allSettled(batch.map(fn))
    for (const r of settled) {
      if (r.status === 'fulfilled') results.push(...r.value)
    }
  }
  return results
}

export async function scrapeAdzuna(
  searchTerms: string[] = CREATIVE_CATEGORIES
): Promise<Omit<Job, 'id' | 'scraped_at'>[]> {
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY

  if (!appId || !appKey) {
    console.warn('Adzuna credentials missing — skipping Adzuna scrape')
    return []
  }

  const seen = new Set<string>()
  const rawResults = await runInBatches(searchTerms, 5, (term) =>
    fetchAdzunaTerm(term, appId, appKey).catch((err) => {
      console.error(`Adzuna error for term "${term}":`, err)
      return []
    })
  )

  const allJobs: Omit<Job, 'id' | 'scraped_at'>[] = []
  for (const r of rawResults) {
    if (seen.has(r.id)) continue
    seen.add(r.id)

    const salaryRange =
      r.salary_min && r.salary_max
        ? `AED ${Math.round(r.salary_min / 12).toLocaleString()} – ${Math.round(r.salary_max / 12).toLocaleString()} /month`
        : undefined

    allJobs.push({
      external_id: r.id,
      source: 'adzuna' as JobSource,
      title: r.title,
      company: r.company?.display_name,
      location: r.location?.display_name || 'Dubai, UAE',
      description: r.description,
      job_url: r.redirect_url,
      salary_range: salaryRange,
      job_type: r.contract_time,
      posted_at: r.created,
      is_active: true,
    })
  }

  return allJobs
}
