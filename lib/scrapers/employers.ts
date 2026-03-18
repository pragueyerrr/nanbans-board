import * as cheerio from 'cheerio'
import type { Job, JobSource } from '@/types'

// Direct employer career pages - Dubai creative/media companies
const EMPLOYER_SITES = [
  // Media publishers
  {
    name: 'Motivate Media',
    url: 'https://www.motivatemedia.com/careers/',
    source: 'motivate_media',
    selectors: {
      item: '.job, .career, .position, article, .vacancy, [class*="job"], [class*="career"], [class*="position"]',
      title: 'h1, h2, h3, h4, a, .title, [class*="title"]',
      link: 'a',
    },
  },
  {
    name: 'ITP Media Group',
    url: 'https://www.itpmediagroup.com/careers',
    source: 'itp_media',
    selectors: {
      item: '.job, .career, .position, article, [class*="job"], [class*="career"]',
      title: 'h2, h3, h4, a, .title, [class*="title"]',
      link: 'a',
    },
  },
  // Advertising agencies
  {
    name: 'Publicis Groupe',
    url: 'https://www.publicisgroupe.com/en/careers',
    source: 'publicis',
    selectors: {
      item: '.job, .career, .position, article, [class*="job"], [class*="career"]',
      title: 'h2, h3, h4, .title, [class*="title"]',
      link: 'a',
    },
  },
  {
    name: 'TBWA RAAD',
    url: 'https://www.tbwaraad.com/careers',
    source: 'tbwa_raad',
    selectors: {
      item: '.job, .career, .position, article, .vacancy, [class*="job"]',
      title: 'h2, h3, h4, a, .title, [class*="title"]',
      link: 'a',
    },
  },
  {
    name: 'Leo Burnett MENA',
    url: 'https://www.leoburnett.com/mena/careers',
    source: 'leo_burnett',
    selectors: {
      item: '.job, .career, .position, article, [class*="job"], [class*="career"]',
      title: 'h2, h3, h4, a, .title, [class*="title"]',
      link: 'a',
    },
  },
  {
    name: 'FP7 McCann',
    url: 'https://fp7mccann.com/careers',
    source: 'fp7_mccann',
    selectors: {
      item: '.job, .career, .position, article, [class*="job"]',
      title: 'h2, h3, h4, a, .title, [class*="title"]',
      link: 'a',
    },
  },
  {
    name: 'Memac Ogilvy',
    url: 'https://www.memacogilvy.com/careers',
    source: 'memac_ogilvy',
    selectors: {
      item: '.job, .career, .vacancy, article, [class*="job"], [class*="career"]',
      title: 'h2, h3, h4, a, .title, [class*="title"]',
      link: 'a',
    },
  },
  {
    name: 'Havas Middle East',
    url: 'https://www.havas.com/careers/',
    source: 'havas_me',
    selectors: {
      item: '.job, .career, .position, article, [class*="job"]',
      title: 'h2, h3, h4, a, .title, [class*="title"]',
      link: 'a',
    },
  },
  // Real estate / hospitality with big creative teams
  {
    name: 'Jumeirah Group',
    url: 'https://www.jumeirah.com/en/jumeirah-group/careers',
    source: 'jumeirah',
    selectors: {
      item: '.job-listing, .career-item, article, .position, [class*="job"]',
      title: 'h2, h3, h4, .title, [class*="title"]',
      link: 'a',
    },
  },
  {
    name: 'Emaar',
    url: 'https://www.emaar.com/en/careers/',
    source: 'emaar',
    selectors: {
      item: '.job, .career, .vacancy, article, [class*="job"], [class*="career"]',
      title: 'h2, h3, h4, .title, [class*="title"]',
      link: 'a',
    },
  },
  // Broadcast & streaming
  {
    name: 'MBC Group',
    url: 'https://www.mbc.net/en/corporate/careers.html',
    source: 'mbc_group',
    selectors: {
      item: '.job, .career, .position, article, [class*="job"], [class*="career"]',
      title: 'h2, h3, h4, a, .title, [class*="title"]',
      link: 'a',
    },
  },
  // Government creative / tourism
  {
    name: 'Dubai Tourism',
    url: 'https://www.visitdubai.com/en/about-dtcm/careers',
    source: 'dubai_tourism',
    selectors: {
      item: '.job, .career, .vacancy, article, [class*="job"]',
      title: 'h2, h3, h4, a, .title, [class*="title"]',
      link: 'a',
    },
  },
]

const CREATIVE_KEYWORDS = [
  'creative', 'design', 'content', 'social media', 'video', 'photo',
  'copy', 'brand', 'marketing', 'art director', 'producer', 'editor',
  'motion', 'digital', 'media', 'campaign', 'advertising', 'visual',
  'graphic', 'ux', 'ui', 'communications', 'pr', 'storytell',
  'animator', 'animation', 'illustrat', 'filmmaker', '3d', 'vfx',
  'writer', 'script', 'photograph', 'cinemat', 'influencer',
  'broadcast', 'publish', 'editorial', 'art department',
]

function isCreativeRole(title: string): boolean {
  const t = title.toLowerCase()
  return CREATIVE_KEYWORDS.some((kw) => t.includes(kw))
}

async function scrapeEmployerSite(
  employer: (typeof EMPLOYER_SITES)[0]
): Promise<Omit<Job, 'id' | 'scraped_at'>[]> {
  const jobs: Omit<Job, 'id' | 'scraped_at'>[] = []

  try {
    const res = await fetch(employer.url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(12000),
    })

    if (!res.ok) {
      console.warn(`${employer.name} returned ${res.status}`)
      return []
    }

    const html = await res.text()
    const $ = cheerio.load(html)
    const seen = new Set<string>()

    // Try to find job listings using the configured selectors
    $(employer.selectors.item).each((_, el) => {
      const $el = $(el)

      // Find title
      const titleEl = $el.find(employer.selectors.title).first()
      const title = titleEl.text().trim() || $el.text().trim().split('\n')[0]?.trim()

      if (!title || title.length < 5 || title.length > 150) return
      if (seen.has(title)) return

      // Only include creative-adjacent roles
      if (!isCreativeRole(title)) return

      seen.add(title)

      // Find link
      const linkEl = $el.find(employer.selectors.link).first()
      const relLink = linkEl.attr('href') ?? ''
      let jobUrl = employer.url
      if (relLink) {
        jobUrl = relLink.startsWith('http')
          ? relLink
          : relLink.startsWith('/')
          ? new URL(relLink, employer.url).href
          : employer.url
      }

      // Find any additional detail text
      const description = $el.text().replace(title, '').trim().slice(0, 500) || undefined

      jobs.push({
        external_id: `${employer.source}_${Buffer.from(title).toString('base64').slice(0, 20)}`,
        source: 'manual' as JobSource,
        title,
        company: employer.name,
        location: 'Dubai, UAE',
        description,
        job_url: jobUrl,
        is_active: true,
        raw_data: { employer_source: employer.source },
      })
    })

    // Fallback: if no items found via selectors, scan all links for job-like text
    if (jobs.length === 0) {
      $('a').each((_, el) => {
        const $el = $(el)
        const text = $el.text().trim()
        const href = $el.attr('href') ?? ''

        if (!text || text.length < 5 || text.length > 120) return
        if (!isCreativeRole(text)) return
        if (seen.has(text)) return
        seen.add(text)

        const jobUrl = href.startsWith('http')
          ? href
          : href.startsWith('/')
          ? new URL(href, employer.url).href
          : employer.url

        jobs.push({
          external_id: `${employer.source}_link_${Buffer.from(text).toString('base64').slice(0, 20)}`,
          source: 'manual' as JobSource,
          title: text,
          company: employer.name,
          location: 'Dubai, UAE',
          job_url: jobUrl,
          is_active: true,
          raw_data: { employer_source: employer.source },
        })
      })
    }
  } catch (err) {
    console.error(`${employer.name} scrape error:`, err)
  }

  return jobs
}

export async function scrapeEmployerSites(): Promise<
  Omit<Job, 'id' | 'scraped_at'>[]
> {
  const results = await Promise.allSettled(
    EMPLOYER_SITES.map((e) => scrapeEmployerSite(e))
  )

  return results.flatMap((r) =>
    r.status === 'fulfilled' ? r.value : []
  )
}
