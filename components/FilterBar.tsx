'use client'

import { GENRES, DAYS, LEVELS, GENRE_COLORS, type Genre, type Level } from '@/lib/types'

type TimeOfDay = 'morning' | 'afternoon' | 'evening'

interface Filters {
  genre: Genre | ''
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

export function FilterBar({ filters, studios, onChange }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })

  return (
    <div className="space-y-3">
      {/* Genre pills */}
      <div className="flex flex-wrap gap-2">
        <Chip
          label="All Genres"
          active={filters.genre === ''}
          color="#888"
          onClick={() => set({ genre: '' })}
        />
        {GENRES.filter(g => g !== 'Other').map(genre => (
          <Chip
            key={genre}
            label={genre}
            active={filters.genre === genre}
            color={GENRE_COLORS[genre]}
            onClick={() => set({ genre: filters.genre === genre ? '' : genre })}
          />
        ))}
      </div>

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

      {/* Day + Level + Studio row */}
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

function Chip({
  label, active, color, onClick,
}: {
  label: string
  active: boolean
  color: string
  onClick: () => void
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
