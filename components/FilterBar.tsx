'use client'

import { useState, useRef, useEffect } from 'react'
import { GENRES, DAYS, LEVELS, GENRE_COLORS, type Genre, type Level } from '@/lib/types'
import type { GenreFilter } from '@/app/page'

type TimeOfDay = 'morning' | 'afternoon' | 'evening'

export interface Filters {
  genres: GenreFilter[]
  day: number | null
  level: Level | ''
  studio: string
  timeOfDay: TimeOfDay | ''
}

interface Props {
  filters: Filters
  studios: string[]
  onChange: (filters: Filters) => void
}

const ALL_GENRE_OPTIONS: { value: GenreFilter; label: string }[] = [
  { value: 'Choreography', label: 'Choreography' },
  ...GENRES.map(g => ({ value: g as GenreFilter, label: g === 'Other' ? 'Other/Choreography' : g })),
]

export function FilterBar({ filters, studios, onChange }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })
  const [genreOpen, setGenreOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setGenreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggleGenre(g: GenreFilter) {
    const next = filters.genres.includes(g)
      ? filters.genres.filter(x => x !== g)
      : [...filters.genres, g]
    set({ genres: next })
  }

  const genreLabel = filters.genres.length === 0
    ? 'All Genres'
    : filters.genres.length === 1
      ? (filters.genres[0] === 'Other' ? 'Other/Choreography' : filters.genres[0])
      : `${filters.genres.length} genres`

  return (
    <div className="space-y-3">
      {/* Time of day pills */}
      <div className="flex flex-wrap gap-2">
        {(['', 'morning', 'afternoon', 'evening'] as const).map(tod => (
          <Chip
            key={tod || 'all-times'}
            label={tod === '' ? 'All Times' : tod === 'morning' ? 'Morning (before noon)' : tod === 'afternoon' ? 'Afternoon (noon–5pm)' : 'Evening (after 5pm)'}
            active={filters.timeOfDay === tod}
            color="#888"
            onClick={() => set({ timeOfDay: filters.timeOfDay === tod ? '' : tod })}
          />
        ))}
      </div>

      {/* Day + Genre + Level + Studio row */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filters.day ?? ''}
          onChange={e => set({ day: e.target.value === '' ? null : parseInt(e.target.value) })}
          className="text-gray-700 text-sm rounded-lg px-3 py-1.5 border border-white/60 outline-none shadow-sm backdrop-blur-md"
        >
          <option value="">All Days</option>
          {DAYS.map((d, i) => (
            <option key={d} value={i}>{d}</option>
          ))}
        </select>

        {/* Genre multi-select dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setGenreOpen(o => !o)}
            className="text-gray-700 text-sm rounded-lg px-3 py-1.5 border border-white/60 shadow-sm backdrop-blur-md flex items-center gap-2"
            style={{ backgroundColor: filters.genres.length > 0 ? 'rgba(255,255,255,0.7)' : undefined }}
          >
            <span>{genreLabel}</span>
            <svg className="w-3 h-3 opacity-50" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 1l4 4 4-4" />
            </svg>
          </button>

          {genreOpen && (
            <div className="absolute z-50 mt-1 left-0 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[210px]">
              {ALL_GENRE_OPTIONS.map(({ value, label }) => {
                const checked = filters.genres.includes(value)
                const color = value === 'Choreography' ? '#C4B5FD' : GENRE_COLORS[value as Genre] ?? '#888'
                return (
                  <label
                    key={value}
                    className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-gray-50 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleGenre(value)}
                      className="rounded"
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    {label}
                  </label>
                )
              })}
              {filters.genres.length > 0 && (
                <div className="border-t border-gray-100 mt-1 pt-1 px-3 pb-1">
                  <button
                    onClick={() => set({ genres: [] })}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <select
          value={filters.level}
          onChange={e => set({ level: e.target.value as Level | '' })}
          className="text-gray-700 text-sm rounded-lg px-3 py-1.5 border border-white/60 outline-none shadow-sm backdrop-blur-md"
        >
          <option value="">All Levels</option>
          {LEVELS.map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        {studios.length > 0 && (
          <select
            value={filters.studio}
            onChange={e => set({ studio: e.target.value })}
            className="text-gray-700 text-sm rounded-lg px-3 py-1.5 border border-white/60 outline-none shadow-sm backdrop-blur-md"
          >
            <option value="">All Studios</option>
            {studios.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}

function Chip({ label, active, color, onClick }: {
  label: string; active: boolean; color: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all border"
      style={{
        backgroundColor: active ? color : 'transparent',
        borderColor: color,
        color: active ? '#1a1a1a' : '#374151',
      }}
    >
      {label}
    </button>
  )
}
