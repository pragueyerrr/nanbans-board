'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Pencil, Trash2, FileText, Check, X } from 'lucide-react'
import type { Application, ApplicationStatus } from '@/types'
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
} from '@/types'
import { clsx } from 'clsx'
import dynamic from 'next/dynamic'

const ResumeModal = dynamic(() => import('@/components/ResumeModal'), { ssr: false })

const COLUMNS: ApplicationStatus[] = [
  'saved',
  'applied',
  'heard_back',
  'interview_scheduled',
  'second_interview',
  'offer_received',
  'rejected',
  'ghosted',
]

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [resumeJobId, setResumeJobId] = useState<string | null>(null)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')

  useEffect(() => {
    const CACHE_KEY = 'applications_v1'
    const CACHE_TTL = 2 * 60 * 1000
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) {
        const { data, ts } = JSON.parse(cached)
        if (Date.now() - ts < CACHE_TTL) {
          setApplications(data)
          setLoading(false)
          return
        }
      }
    } catch {}
    fetch('/api/applications')
      .then((r) => r.json())
      .then((d) => {
        const apps = d.applications ?? []
        setApplications(apps)
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: apps, ts: Date.now() })) } catch {}
      })
      .finally(() => setLoading(false))
  }, [])

  const invalidateCache = () => { try { sessionStorage.removeItem('applications_v1') } catch {} }

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    const res = await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const data = await res.json()
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? data.application : a))
      )
      invalidateCache()
    }
  }

  const saveNotes = async (id: string) => {
    const res = await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: editNotes }),
    })
    if (res.ok) {
      const data = await res.json()
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? data.application : a))
      )
      invalidateCache()
    }
    setEditingId(null)
  }

  const deleteApp = async (id: string) => {
    if (!confirm('Remove this application?')) return
    await fetch(`/api/applications/${id}`, { method: 'DELETE' })
    setApplications((prev) => prev.filter((a) => a.id !== id))
    invalidateCache()
  }

  const resumeJob = resumeJobId
    ? applications.find((a) => a.job_id === resumeJobId)?.job ?? null
    : null

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-slate-100 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Application Tracker</h1>
          <p className="text-slate-500 text-sm">{applications.length} applications total</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('kanban')}
            className={clsx('btn-secondary text-xs', view === 'kanban' && 'bg-brand-900 text-brand-300 border-brand-700')}
          >
            Kanban
          </button>
          <button
            onClick={() => setView('list')}
            className={clsx('btn-secondary text-xs', view === 'list' && 'bg-brand-900 text-brand-300 border-brand-700')}
          >
            List
          </button>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          No applications tracked yet. Save jobs from the Jobs page to get started.
        </div>
      ) : view === 'kanban' ? (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {COLUMNS.filter((col) =>
              applications.some((a) => a.status === col)
            ).map((col) => {
              const colApps = applications.filter((a) => a.status === col)
              if (colApps.length === 0) return null
              return (
                <div key={col} className="w-64 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={clsx('badge', APPLICATION_STATUS_COLORS[col])}>
                      {APPLICATION_STATUS_LABELS[col]}
                    </span>
                    <span className="text-xs text-slate-400">{colApps.length}</span>
                  </div>
                  <div className="space-y-2">
                    {colApps.map((app) => (
                      <KanbanCard
                        key={app.id}
                        app={app}
                        editingId={editingId}
                        editNotes={editNotes}
                        onEditNotes={(id, notes) => {
                          setEditingId(id)
                          setEditNotes(notes ?? '')
                        }}
                        onSaveNotes={saveNotes}
                        onCancelEdit={() => setEditingId(null)}
                        setEditNotes={setEditNotes}
                        onStatusChange={updateStatus}
                        onDelete={deleteApp}
                        onGenerate={(jobId) => setResumeJobId(jobId)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="card divide-y">
          {applications.map((app) => (
            <ListRow
              key={app.id}
              app={app}
              onStatusChange={updateStatus}
              onDelete={deleteApp}
              onGenerate={(jobId) => setResumeJobId(jobId)}
            />
          ))}
        </div>
      )}

      {resumeJob && (
        <ResumeModal
          job={resumeJob}
          onClose={() => setResumeJobId(null)}
        />
      )}
    </div>
  )
}

function KanbanCard({
  app,
  editingId,
  editNotes,
  onEditNotes,
  onSaveNotes,
  onCancelEdit,
  setEditNotes,
  onStatusChange,
  onDelete,
  onGenerate,
}: {
  app: Application
  editingId: string | null
  editNotes: string
  onEditNotes: (id: string, notes: string | undefined) => void
  onSaveNotes: (id: string) => void
  onCancelEdit: () => void
  setEditNotes: (s: string) => void
  onStatusChange: (id: string, s: ApplicationStatus) => void
  onDelete: (id: string) => void
  onGenerate: (jobId: string) => void
}) {
  return (
    <div className="card p-3 text-sm">
      <div className="font-medium text-slate-800 line-clamp-2 leading-tight">
        {app.job?.title ?? 'Unknown'}
      </div>
      <div className="text-xs text-slate-500 mt-0.5">{app.job?.company}</div>

      {app.match_score !== undefined && app.match_score !== null && (
        <div className="mt-1.5 flex items-center gap-1">
          <div className="flex-1 bg-slate-100 rounded-full h-1.5">
            <div
              className="bg-brand-500 h-1.5 rounded-full"
              style={{ width: `${app.match_score}%` }}
            />
          </div>
          <span className="text-xs font-mono text-brand-600">{app.match_score}</span>
        </div>
      )}

      {editingId === app.id ? (
        <div className="mt-2 space-y-1">
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            className="input text-xs resize-none"
            rows={3}
            placeholder="Notes…"
          />
          <div className="flex gap-1">
            <button
              onClick={() => onSaveNotes(app.id)}
              className="btn-primary text-xs py-0.5 px-2"
            >
              <Check className="w-3 h-3" />
            </button>
            <button onClick={onCancelEdit} className="btn-secondary text-xs py-0.5 px-2">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : app.notes ? (
        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 italic">{app.notes}</p>
      ) : null}

      {/* Status selector */}
      <select
        value={app.status}
        onChange={(e) => onStatusChange(app.id, e.target.value as ApplicationStatus)}
        className="mt-2 w-full text-xs border rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500"
      >
        {Object.entries(APPLICATION_STATUS_LABELS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1 mt-2">
        <button onClick={() => onEditNotes(app.id, app.notes ?? '')} className="btn-ghost text-xs p-1">
          <Pencil className="w-3 h-3" />
        </button>
        <button onClick={() => onGenerate(app.job_id)} className="btn-ghost text-xs p-1">
          <FileText className="w-3 h-3" />
        </button>
        {app.job?.job_url && (
          <a href={app.job.job_url} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs p-1">
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        <button onClick={() => onDelete(app.id)} className="btn-ghost text-xs p-1 text-red-500 ml-auto">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

function ListRow({
  app,
  onStatusChange,
  onDelete,
  onGenerate,
}: {
  app: Application
  onStatusChange: (id: string, s: ApplicationStatus) => void
  onDelete: (id: string) => void
  onGenerate: (jobId: string) => void
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-800 truncate text-sm">
          {app.job?.title ?? 'Unknown'}
        </div>
        <div className="text-xs text-slate-500">{app.job?.company}</div>
      </div>

      {app.match_score !== undefined && app.match_score !== null && (
        <span className="text-sm font-mono text-brand-600 w-10 text-right">
          {app.match_score}
        </span>
      )}

      <select
        value={app.status}
        onChange={(e) => onStatusChange(app.id, e.target.value as ApplicationStatus)}
        className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500"
      >
        {Object.entries(APPLICATION_STATUS_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>

      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onGenerate(app.job_id)} className="btn-ghost text-xs p-1.5">
          <FileText className="w-3.5 h-3.5" />
        </button>
        {app.job?.job_url && (
          <a href={app.job.job_url} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs p-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        <button onClick={() => onDelete(app.id)} className="btn-ghost text-xs p-1.5 text-red-400 hover:text-red-600">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
