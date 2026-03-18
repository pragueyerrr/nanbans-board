'use client'

import type { JobScore } from '@/types'
import { clsx } from 'clsx'

interface Props {
  score: JobScore
  size?: 'sm' | 'md' | 'lg'
}

const FIT_COLORS = {
  excellent: { ring: '#9ece6a', text: 'text-[#9ece6a]', bg: 'bg-[#070f00]' },
  good:      { ring: '#7aa2f7', text: 'text-[#7aa2f7]', bg: 'bg-[#080f20]' },
  fair:      { ring: '#e0af68', text: 'text-[#e0af68]', bg: 'bg-[#120d00]' },
  reach:     { ring: '#f7768e', text: 'text-[#f7768e]', bg: 'bg-[#1a0008]' },
}

export function ScoreCircle({ score, size = 'md' }: Props) {
  const { ring, text, bg } = FIT_COLORS[score.fitLevel]
  const sizes = { sm: 52, md: 72, lg: 96 }
  const r = { sm: 20, md: 28, lg: 38 }
  const strokeW = size === 'lg' ? 5 : 4
  const dim = sizes[size]
  const radius = r[size]
  const circ = 2 * Math.PI * radius
  const offset = circ - (score.total / 100) * circ
  const fs = size === 'sm' ? 'text-base' : size === 'md' ? 'text-xl' : 'text-3xl'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="#1c1c1c"
          strokeWidth={strokeW}
        />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke={ring}
          strokeWidth={strokeW}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${dim / 2} ${dim / 2})`}
          className="score-ring"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={clsx('font-bold leading-none', text, fs)}>
          {score.total}
        </span>
        <span className="text-slate-400 text-xs">/100</span>
      </div>
    </div>
  )
}

export function ScoreBreakdown({ score }: Props) {
  const bars = [
    { label: 'Title Match', value: score.breakdown.titleMatch, max: 20 },
    { label: 'Skills', value: score.breakdown.skillMatch, max: 40 },
    { label: 'Experience', value: score.breakdown.experienceLevel, max: 20 },
    { label: 'Industry', value: score.breakdown.industryMatch, max: 10 },
    { label: 'Location', value: score.breakdown.locationBonus, max: 10 },
  ]

  const { text, bg } = FIT_COLORS[score.fitLevel]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ScoreCircle score={score} size="md" />
        <div>
          <div className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold capitalize', bg, text)}>
            {score.fitLevel} match
          </div>
          <p className="text-sm text-slate-600 mt-1">{score.recommendation}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {bars.map((bar) => (
          <div key={bar.label} className="flex items-center gap-2 text-xs">
            <span className="w-20 text-slate-500 shrink-0">{bar.label}</span>
            <div className="flex-1 bg-slate-100 rounded-full h-1.5">
              <div
                className="bg-brand-500 h-1.5 rounded-full transition-all"
                style={{ width: `${(bar.value / bar.max) * 100}%` }}
              />
            </div>
            <span className="w-10 text-right text-slate-600 font-mono">
              {bar.value}/{bar.max}
            </span>
          </div>
        ))}
      </div>

      {score.matchedSkills.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">Matched skills</p>
          <div className="flex flex-wrap gap-1">
            {score.matchedSkills.map((s) => (
              <span key={s} className="badge bg-[#070f00] text-[#9ece6a]">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {score.missingSkills.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">Skills to develop</p>
          <div className="flex flex-wrap gap-1">
            {score.missingSkills.map((s) => (
              <span key={s} className="badge bg-[#111111] text-[#4b5563]">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
