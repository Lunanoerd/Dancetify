'use client'

import type { DanceClass } from '@/lib/types'
import { GENRE_COLORS, STUDIO_LOCATIONS } from '@/lib/types'

interface Props {
  cls: DanceClass
  specificDate: string
  onClick: (cls: DanceClass, specificDate: string) => void
}

export function ClassCard({ cls, specificDate, onClick }: Props) {
  const color = GENRE_COLORS[cls.genre] ?? '#888'
  const loc = STUDIO_LOCATIONS[cls.studioName]

  return (
    <button
      onClick={() => onClick(cls, specificDate)}
      className="w-full text-left rounded-lg p-3 transition-all hover:scale-[1.02] hover:brightness-110 cursor-pointer"
      style={{ backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', borderLeft: `3px solid ${color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide truncate max-w-[120px]"
          style={{ backgroundColor: color + '33', color: color }}
        >
          {cls.genre}
        </span>
      </div>
      <p className="text-sm font-semibold text-gray-800 truncate">{cls.className}</p>
      <p className="text-xs text-gray-500 truncate">{cls.instructor}</p>
      <p className="text-xs text-gray-400 mt-1">
        {cls.startTime} – {cls.endTime}
      </p>
      <div className="flex items-center justify-between mt-0.5">
        <p className="text-xs text-gray-400 truncate">{cls.studioName}</p>
        {loc && (
          <a
            href={loc.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-[10px] text-gray-400 hover:text-gray-600 shrink-0 ml-1 underline underline-offset-2"
          >
            📍 {loc.label}
          </a>
        )}
      </div>
    </button>
  )
}
