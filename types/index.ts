// ============================================================
// Core domain types
// ============================================================

export type JobSource = 'adzuna' | 'indeed_rss' | 'bayt' | 'gulftalent' | 'manual'

export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'heard_back'
  | 'interview_scheduled'
  | 'second_interview'
  | 'offer_received'
  | 'rejected'
  | 'withdrawn'
  | 'ghosted'

export interface Job {
  id: string
  external_id?: string
  source: JobSource
  title: string
  company?: string
  location?: string
  description?: string
  requirements?: string
  salary_range?: string
  job_url?: string
  job_type?: string
  posted_at?: string
  scraped_at: string
  is_active: boolean
  raw_data?: Record<string, unknown>
}

export interface Application {
  id: string
  job_id: string
  status: ApplicationStatus
  applied_at?: string
  notes?: string
  match_score?: number
  resume_latex?: string
  resume_data?: ResumeData
  cover_letter_text?: string
  created_at: string
  updated_at: string
  job?: Job
}

export interface CVProfile {
  id: string
  name?: string
  email?: string
  phone?: string
  location?: string
  website?: string
  linkedin?: string
  portfolio?: string
  raw_text?: string
  parsed_data?: ParsedCV
  created_at: string
  updated_at: string
}

export interface ParsedCV {
  summary?: string
  skills: string[]
  experiences: WorkExperience[]
  education: Education[]
  certifications?: string[]
  languages?: string[]
  tools?: string[]
  softwareSkills?: string[]
  portfolioLinks?: string[]
}

export interface WorkExperience {
  title: string
  company: string
  location?: string
  startDate: string
  endDate?: string
  current?: boolean
  bullets: string[]
}

export interface Education {
  degree: string
  institution: string
  location?: string
  year?: string
  gpa?: string
}

// ============================================================
// Resume generation types
// ============================================================

export interface ResumeData {
  name: string
  email: string
  phone?: string
  location?: string
  website?: string
  linkedin?: string
  portfolio?: string
  summary: string
  skills: SkillGroup[]
  experiences: ResumeExperience[]
  education: Education[]
  certifications?: string[]
  additionalSection?: { title: string; items: string[] }
  fontSizePt: 9.5 | 10 | 10.5 | 11
  compact: boolean
}

export interface SkillGroup {
  category: string
  items: string[]
}

export interface ResumeExperience {
  title: string
  company: string
  location?: string
  period: string
  bullets: string[]
  relevanceScore: number
}

export interface JobScore {
  total: number
  breakdown: {
    titleMatch: number
    skillMatch: number
    experienceLevel: number
    industryMatch: number
    locationBonus: number
  }
  matchedSkills: string[]
  missingSkills: string[]
  recommendation: string
  fitLevel: 'excellent' | 'good' | 'fair' | 'reach'
}

// ============================================================
// API response types
// ============================================================

export interface ApiResponse<T> {
  data?: T
  error?: string
}

export interface ScrapedJobsResult {
  jobs: Omit<Job, 'id' | 'scraped_at'>[]
  source: JobSource
  count: number
  cached: boolean
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  heard_back: 'Heard Back',
  interview_scheduled: '1st Interview',
  second_interview: '2nd Interview',
  offer_received: 'Offer Received',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  ghosted: 'Ghosted',
}

export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved:                'bg-[#111111] text-[#4b5563]',
  applied:              'bg-[#080f20] text-[#7aa2f7]',
  heard_back:           'bg-[#120d00] text-[#e0af68]',
  interview_scheduled:  'bg-[#001210] text-[#73daca]',
  second_interview:     'bg-[#070f00] text-[#9ece6a]',
  offer_received:       'bg-[#120700] text-[#ff9e64]',
  rejected:             'bg-[#1a0008] text-[#f7768e]',
  withdrawn:            'bg-[#0c0c0c] text-[#2d2d2d]',
  ghosted:              'bg-[#120700] text-[#e0af68]',
}
