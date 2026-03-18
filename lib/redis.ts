import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// TTL constants (in seconds)
export const CACHE_TTL = {
  JOBS_LIST: 60 * 60 * 24,      // 24 hours - scraped job lists
  JOB_DETAIL: 60 * 60 * 48,     // 48 hours - individual job detail
  CV_PARSED: 60 * 60 * 24 * 7,  // 7 days - parsed CV data
  SCORE: 60 * 60 * 24 * 3,      // 3 days - job match scores
}

export const cacheKeys = {
  jobsList: (source: string, query: string) =>
    `jobs:${source}:${query.toLowerCase().replace(/\s+/g, '_')}`,
  jobDetail: (id: string) => `job:${id}`,
  cvProfile: () => 'cv:current',
  jobScore: (jobId: string) => `score:${jobId}`,
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const val = await redis.get<T>(key)
    return val
  } catch {
    return null
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  ttl: number
): Promise<void> {
  try {
    await redis.setex(key, ttl, value)
  } catch (err) {
    console.error('Redis set error:', err)
  }
}
