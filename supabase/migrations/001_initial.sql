-- ============================================================
-- Dubai Creative Jobs - Initial Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Jobs table: scraped job listings
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  description TEXT,
  requirements TEXT,
  salary_range TEXT,
  job_url TEXT,
  job_type TEXT,
  posted_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  raw_data JSONB,
  UNIQUE(external_id, source)
);

CREATE INDEX IF NOT EXISTS jobs_source_idx ON jobs(source);
CREATE INDEX IF NOT EXISTS jobs_scraped_at_idx ON jobs(scraped_at DESC);
CREATE INDEX IF NOT EXISTS jobs_is_active_idx ON jobs(is_active);
CREATE INDEX IF NOT EXISTS jobs_title_idx ON jobs USING gin(to_tsvector('english', title));

-- Applications table: user's job applications
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'saved'
    CHECK (status IN ('saved','applied','heard_back','interview_scheduled',
                      'second_interview','offer_received','rejected','withdrawn','ghosted')),
  applied_at TIMESTAMPTZ,
  notes TEXT,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  resume_latex TEXT,
  cover_letter_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_id)
);

CREATE INDEX IF NOT EXISTS applications_status_idx ON applications(status);
CREATE INDEX IF NOT EXISTS applications_job_id_idx ON applications(job_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS applications_updated_at ON applications;
CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- CV profiles table: user's base CV (single row)
CREATE TABLE IF NOT EXISTS cv_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  website TEXT,
  linkedin TEXT,
  portfolio TEXT,
  raw_text TEXT,
  parsed_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS cv_profiles_updated_at ON cv_profiles;
CREATE TRIGGER cv_profiles_updated_at
  BEFORE UPDATE ON cv_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
