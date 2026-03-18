'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Upload,
  User,
  Loader2,
  CheckCircle2,
  Pencil,
  Globe,
  Linkedin,
  Phone,
  Mail,
  MapPin,
  Briefcase,
} from 'lucide-react'
import type { CVProfile } from '@/types'

interface FormData {
  name: string
  email: string
  phone: string
  location: string
  website: string
  linkedin: string
  portfolio: string
}

export default function ProfilePage() {
  const [cv, setCV] = useState<CVProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualText, setManualText] = useState('')
  const [tab, setTab] = useState<'upload' | 'paste' | 'parsed'>('upload')
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
    portfolio: '',
  })

  useEffect(() => {
    const CACHE_KEY = 'cv_profile_v1'
    const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

    try {
      const raw = sessionStorage.getItem(CACHE_KEY)
      if (raw) {
        const { ts, cv: cached } = JSON.parse(raw)
        if (Date.now() - ts < CACHE_TTL && cached) {
          setCV(cached)
          setForm({
            name: cached.name ?? '',
            email: cached.email ?? '',
            phone: cached.phone ?? '',
            location: cached.location ?? '',
            website: cached.website ?? '',
            linkedin: cached.linkedin ?? '',
            portfolio: cached.portfolio ?? '',
          })
          setLoading(false)
          return
        }
      }
    } catch {}

    fetch('/api/cv/upload')
      .then((r) => r.json())
      .then((d) => {
        if (d.cv) {
          setCV(d.cv)
          setForm({
            name: d.cv.name ?? '',
            email: d.cv.email ?? '',
            phone: d.cv.phone ?? '',
            location: d.cv.location ?? '',
            website: d.cv.website ?? '',
            linkedin: d.cv.linkedin ?? '',
            portfolio: d.cv.portfolio ?? '',
          })
          try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), cv: d.cv })) } catch {}
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleUpload = async (file?: File) => {
    setUploading(true)
    setError(null)
    setSaved(false)

    const fd = new FormData()
    if (file) fd.append('file', file)
    if (manualText) fd.append('text', manualText)
    Object.entries(form).forEach(([k, v]) => {
      if (v) fd.append(k, v)
    })

    try {
      const res = await fetch('/api/cv/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setCV(data.cv)
      try { sessionStorage.setItem('cv_profile_v1', JSON.stringify({ ts: Date.now(), cv: data.cv })) } catch {}
      setSaved(true)
      setTab('parsed')
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(String(e))
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleUpload(f)
  }

  const handleContactSave = async () => {
    setUploading(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (v) fd.append(k, v)
    })
    if (cv?.raw_text) fd.append('text', cv.raw_text)

    try {
      const res = await fetch('/api/cv/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      setCV(data.cv)
      try { sessionStorage.setItem('cv_profile_v1', JSON.stringify({ ts: Date.now(), cv: data.cv })) } catch {}
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(String(e))
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    )
  }

  const parsed = cv?.parsed_data

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <User className="w-6 h-6 text-brand-500" />
          My CV Profile
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload your base CV once — the AI will tailor it for every job you apply to.
        </p>
      </div>

      {/* Contact Info */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <User className="w-4 h-4" />
          Contact Details
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { key: 'name', label: 'Full Name', icon: User },
            { key: 'email', label: 'Email', icon: Mail },
            { key: 'phone', label: 'Phone (+971…)', icon: Phone },
            { key: 'location', label: 'Location', icon: MapPin },
            { key: 'website', label: 'Website / Portfolio URL', icon: Globe },
            { key: 'linkedin', label: 'LinkedIn URL', icon: Linkedin },
            { key: 'portfolio', label: 'Portfolio / Behance / Dribbble', icon: Briefcase },
          ].map(({ key, label, icon: Icon }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {label}
              </label>
              <input
                type="text"
                value={form[key as keyof FormData]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                className="input text-sm"
                placeholder={label}
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleContactSave}
          disabled={uploading}
          className="btn-primary mt-4"
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : null}
          {uploading ? 'Saving…' : saved ? 'Saved!' : 'Save Details'}
        </button>
      </div>

      {/* CV Upload */}
      <div className="card p-5">
        <div className="flex border-b mb-4 gap-4">
          {(['upload', 'paste', cv ? 'parsed' : undefined] as const)
            .filter(Boolean)
            .map((t) => (
              <button
                key={t}
                onClick={() => setTab(t!)}
                className={`py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === t
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'upload'
                  ? 'Upload File'
                  : t === 'paste'
                  ? 'Paste Text'
                  : 'Parsed Data'}
              </button>
            ))}
        </div>

        {tab === 'upload' && (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors"
          >
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-medium text-slate-700">
              Drop your CV here or click to browse
            </p>
            <p className="text-xs text-slate-400 mt-1">PDF, DOCX, or TXT</p>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            {uploading && (
              <div className="flex items-center justify-center gap-2 mt-4 text-brand-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Parsing with Claude…</span>
              </div>
            )}
          </div>
        )}

        {tab === 'paste' && (
          <div className="space-y-3">
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              className="input resize-none text-sm font-mono"
              rows={14}
              placeholder="Paste your CV text here…"
            />
            <button
              onClick={() => handleUpload()}
              disabled={uploading || !manualText.trim()}
              className="btn-primary"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? 'Parsing…' : 'Parse & Save'}
            </button>
          </div>
        )}

        {tab === 'parsed' && parsed && (
          <div className="space-y-4 text-sm">
            {parsed.summary && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Summary
                </h3>
                <p className="text-slate-700">{parsed.summary}</p>
              </div>
            )}

            {parsed.skills?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Skills ({parsed.skills.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {parsed.skills.map((s) => (
                    <span key={s} className="badge bg-brand-50 text-brand-700">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {parsed.experiences?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Experience
                </h3>
                <div className="space-y-3">
                  {parsed.experiences.map((exp, i) => (
                    <div key={i} className="bg-slate-50 rounded-lg p-3">
                      <div className="flex justify-between">
                        <span className="font-medium">{exp.title}</span>
                        <span className="text-slate-400 text-xs">
                          {exp.startDate}
                          {exp.endDate ? ` – ${exp.endDate}` : exp.current ? ' – Present' : ''}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">{exp.company}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t">
              <button
                onClick={() => setTab('upload')}
                className="btn-secondary text-xs"
              >
                <Pencil className="w-3 h-3" />
                Update CV
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {saved && !uploading && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            CV saved and parsed successfully!
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="card p-5 bg-brand-50 border-brand-100">
        <h3 className="font-medium text-brand-800 mb-2">Tips for best results</h3>
        <ul className="text-sm text-brand-700 space-y-1 list-disc list-inside">
          <li>Upload a comprehensive CV with all your creative experience</li>
          <li>Include portfolio links, tools, and software you use</li>
          <li>List quantified achievements where possible</li>
          <li>The AI will pick the most relevant parts for each job</li>
          <li>Download .tex files to compile with Overleaf for perfect PDF quality</li>
        </ul>
      </div>
    </div>
  )
}
