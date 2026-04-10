'use client'

import { useState } from 'react'
import { GENRES } from '@/lib/types'

interface Props {
  onClose: () => void
  onSaved: () => void
}

export function ManualClassModal({ onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    studioName: '',
    genre: GENRES[0],
    instructor: '',
    classDate: '',
    startTime: '',
    endTime: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/log/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to save')
      onSaved()
      onClose()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <form
        className="relative z-10 w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)' }}
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Log a class manually</h2>

        <div className="space-y-3">
          <Field label="Studio name *">
            <input required className={inputCls} value={form.studioName} onChange={e => setForm(f => ({ ...f, studioName: e.target.value }))} placeholder="e.g. Pineapple Dance Studios" />
          </Field>
          <Field label="Genre *">
            <select required className={inputCls} value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value as typeof GENRES[number] }))}>
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Instructor *">
            <input required className={inputCls} value={form.instructor} onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))} placeholder="e.g. Jane Smith" />
          </Field>
          <Field label="Date *">
            <input required type="date" className={inputCls} value={form.classDate} onChange={e => setForm(f => ({ ...f, classDate: e.target.value }))} />
          </Field>
          <div className="flex gap-3">
            <Field label="Start time">
              <input type="time" className={inputCls} value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
            </Field>
            <Field label="End time">
              <input type="time" className={inputCls} value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
            </Field>
          </div>
        </div>

        {error && <p className="text-red-500 text-xs mt-3">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-5 w-full py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: '#CE93D8' }}
        >
          {saving ? 'Saving…' : 'Save class'}
        </button>
      </form>
    </div>
  )
}

const inputCls = 'w-full rounded-xl px-3 py-2 text-sm bg-white/70 border border-white/60 outline-none focus:ring-2 focus:ring-purple-200'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex-1">
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}
