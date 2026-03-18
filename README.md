# Dubai Creative Jobs

AI-powered job tracker for creative professionals in Dubai. Scrapes jobs, scores them against your CV, and generates tailored one-page resumes + cover letters.

## Features

- **Job Scraping** — Adzuna API (UAE), Indeed RSS, Bayt.com with 24h Redis cache
- **Application Tracker** — Kanban + list view, statuses: Saved → Applied → Heard Back → Interview → Offer / Rejected / Ghosted
- **AI Job Scoring** — Claude `claude-opus-4-6` scores each job 0–100 against your CV with skill breakdown
- **AI Resume Generation** — Tailored one-page resume as:
  - PDF (in-app download via `@react-pdf/renderer`)
  - `.tex` file (download and compile with Overleaf or local LaTeX)
- **AI Cover Letter** — Streamed, personalized cover letter per job
- **CV Upload** — PDF, DOCX, or TXT; parsed to structured JSON by Claude

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Cache | Upstash Redis (Vercel-compatible) |
| AI | Claude `claude-opus-4-6` with adaptive thinking |
| PDF | `@react-pdf/renderer` (in-app) + LaTeX `.tex` (Overleaf) |
| Hosting | Vercel |

## Setup

### 1. Install dependencies

```bash
cd dubai-creative-jobs
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Fill in:
- **Supabase** — Create project at [supabase.com](https://supabase.com), copy URL + anon key + service role key
- **Upstash Redis** — Create database at [upstash.com](https://upstash.com), copy REST URL + token
- **Anthropic** — Get API key from [console.anthropic.com](https://console.anthropic.com)
- **Adzuna** — Free API key at [developer.adzuna.com](https://developer.adzuna.com) (250 calls/day free)

### 3. Set up database

Run `supabase/migrations/001_initial.sql` in your Supabase SQL editor.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## LaTeX Compilation

The app generates beautiful `.tex` files you can compile two ways:

**Option A — Overleaf (recommended, free):**
1. Go to [overleaf.com](https://overleaf.com)
2. New Project → Upload → select the `.tex` file
3. Compile → Download PDF

**Option B — Local (Windows):**
1. Install [MiKTeX](https://miktex.org/download)
2. Run: `pdflatex resume.tex`

Required packages (auto-installed by MiKTeX): `geometry`, `hyperref`, `fontawesome5`, `enumitem`, `titlesec`, `microtype`, `lmodern`, `parskip`, `xcolor`

## Usage

1. **Upload your CV** → `/profile` — Upload PDF/DOCX or paste text
2. **Scrape jobs** → Click "Refresh Jobs" on the Dashboard or Jobs page
3. **Score a job** → Click "Score Match" on any job card (requires CV)
4. **Save & track** → Click "Save Job" then manage status in Applications
5. **Generate resume** → From Applications page, click the file icon → download PDF or `.tex`

## Caching

| Data | TTL |
|---|---|
| Scraped job lists | 24 hours |
| Individual job details | 48 hours |
| CV parsed data | 7 days |
| Job match scores | 3 days |

The "Refresh Jobs" button bypasses the 6-hour minimum re-scrape window.

## Creative Job Categories Scraped

Content Creator, Art Director, Creative Director, Graphic Designer, Video Editor, Motion Graphics Designer, Copywriter, Social Media Manager, Brand Designer, Creative Producer, Photographer, UX/UI Designer
