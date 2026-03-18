'use client'

import { useState } from 'react'
import { Building2, MapPin, Clock, ExternalLink, Bookmark, TrendingUp } from 'lucide-react'
import type { Job, Application, JobScore } from '@/types'
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '@/types'
import { ScoreCircle } from './ScoreDisplay'
import { clsx } from 'clsx'

interface Props {
  job: Job
  application?: Application
  onSave: (jobId: string) => Promise<void>
  onScore: (jobId: string) => Promise<JobScore | null>
  onGenerate: (jobId: string) => void
}

export default function JobCard({
  job,
  application,
  onSave,
  onScore,
  onGenerate,
}: Props) {
  const [saving, setSaving] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [score, setScore] = useState<JobScore | null>(null)
  const [showScore, setShowScore] = useState(false)

  const timeAgo = job.posted_at
    ? formatTimeAgo(new Date(job.posted_at))
    : job.scraped_at
    ? formatTimeAgo(new Date(job.scraped_at))
    : null

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(job.id)
    } finally {
      setSaving(false)
    }
  }

  const handleScore = async () => {
    if (score) {
      setShowScore(!showScore)
      return
    }
    setScoring(true)
    try {
      const s = await onScore(job.id)
      setScore(s)
      setShowScore(true)
    } finally {
      setScoring(false)
    }
  }

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div>
              <h3 className="font-semibold text-slate-900 leading-tight line-clamp-2">
                {job.title}
              </h3>
              {job.company && (
                <div className="flex items-center gap-1 mt-0.5 text-sm text-slate-600">
                  <Building2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">{job.company}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {job.location}
              </span>
            )}
            {timeAgo && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo}
              </span>
            )}
            {job.salary_range && (
              <span className="font-medium" style={{ color: 'var(--tn-yellow)' }}>{job.salary_range}</span>
            )}
            <span className="badge bg-[#111111] text-[#4b5563] capitalize">
              {job.source.replace('_', ' ')}
            </span>
            {job.job_type && (
              <span className="badge bg-[#001210] text-[#73daca]">{job.job_type}</span>
            )}
          </div>

          {job.description && (
            <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
              {job.description}
            </p>
          )}
        </div>

        {/* Score circle (if scored) */}
        {score && (
          <div className="shrink-0 cursor-pointer" onClick={() => setShowScore(!showScore)}>
            <ScoreCircle score={score} size="sm" />
          </div>
        )}
      </div>

      {/* Score breakdown panel */}
      {showScore && score && (
        <div className="mt-3 pt-3 border-t">
          <div className="grid grid-cols-5 gap-2 text-xs">
            {Object.entries(score.breakdown).map(([key, val]) => (
              <div key={key} className="text-center">
                <div className="font-semibold text-brand-600">{val}</div>
                <div className="text-slate-400 text-[10px] capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-2 italic">{score.recommendation}</p>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
        {application ? (
          <span
            className={clsx(
              'badge',
              APPLICATION_STATUS_COLORS[application.status]
            )}
          >
            {APPLICATION_STATUS_LABELS[application.status]}
          </span>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary text-xs py-1.5"
          >
            <Bookmark className="w-3 h-3" />
            {saving ? 'Saving…' : 'Save Job'}
          </button>
        )}

        <button
          onClick={handleScore}
          disabled={scoring}
          className="btn-secondary text-xs py-1.5"
        >
          <TrendingUp className="w-3 h-3" />
          {scoring ? 'Scoring…' : score ? 'See Score' : 'Score Match'}
        </button>

        {application && (
          <button
            onClick={() => onGenerate(job.id)}
            className="btn-secondary text-xs py-1.5"
          >
            Generate Resume
          </button>
        )}

        {job.job_url && (
          <a
            href={job.job_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto btn-ghost text-xs"
          >
            <ExternalLink className="w-3 h-3" />
            View Job
          </a>
        )}
      </div>
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString('en-AE', { month: 'short', day: 'numeric' })
}
