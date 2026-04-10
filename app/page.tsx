'use client'

import { useState, useEffect, useCallback } from 'react'
import { FilterBar } from '@/components/FilterBar'
import { Timetable } from '@/components/Timetable'
import { ClassModal } from '@/components/ClassModal'
import UserButton from '@/components/UserButton'
import type { DanceClass, Genre, Level } from '@/lib/types'

type TimeOfDay = 'morning' | 'afternoon' | 'evening'

interface Filters {
  genre: Genre | ''
  day: number | null
  level: Level | ''
  studio: string
  timeOfDay: TimeOfDay | ''
}

const DEFAULT_FILTERS: Filters = { genre: '', day: null, level: '', studio: '', timeOfDay: '' }

function matchesTimeOfDay(startTime: string, tod: TimeOfDay | ''): boolean {
  if (!tod) return true
  const [h, m] = startTime.split(':').map(Number)
  const mins = h * 60 + (m || 0)
  if (tod === 'morning') return mins <= 12 * 60        // ≤ 12:00
  if (tod === 'afternoon') return mins > 12 * 60 && mins <= 17 * 60  // 12:01–17:00
  return mins > 17 * 60                                 // > 17:00
}

export default function Home() {
  const [classes, setClasses] = useState<DanceClass[]>([])
  const [studios, setStudios] = useState<string[]>([])
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [selected, setSelected] = useState<{ cls: DanceClass; specificDate: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchClasses = useCallback(async (f: Filters) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (f.genre) params.set('genre', f.genre)
    if (f.day !== null) params.set('day', String(f.day))
    if (f.level) params.set('level', f.level)
    if (f.studio) params.set('studio', f.studio)

    try {
      const res = await fetch(`/api/classes?${params}`)
      const data: DanceClass[] = await res.json()
      setClasses(data)
    } catch (e) {
      console.error('fetchClasses failed:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load all studios once for the filter dropdown
  useEffect(() => {
    fetch('/api/classes')
      .then(r => r.json())
      .then((all: DanceClass[]) => {
        const unique = [...new Set(all.map((c: DanceClass) => c.studioName))].sort()
        setStudios(unique)
      })
      .catch(e => console.error('studios fetch failed:', e))
  }, [])

  useEffect(() => {
    // timeOfDay is client-side only — don't re-fetch for it
    fetchClasses(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.genre, filters.day, filters.level, filters.studio, fetchClasses])

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/40 px-6 py-5 backdrop-blur-md" style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <img src="/logo-cropped.png" alt="Dancetify" className="h-8 w-auto" />
            <p className="text-xs text-gray-400 mt-2">London dance classes, all in one place</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">
              {classes.filter(c => matchesTimeOfDay(c.startTime, filters.timeOfDay)).length} classes
            </span>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="mb-8">
          <FilterBar filters={filters} studios={studios} onChange={setFilters} />
        </div>

        {/* Timetable */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#CE93D8', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <Timetable
            classes={classes.filter(c => matchesTimeOfDay(c.startTime, filters.timeOfDay))}
            onClassClick={(cls, specificDate) => setSelected({ cls, specificDate })}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400 space-x-4">
        <a href="/privacy" className="underline hover:text-gray-600">Privacy Policy</a>
        <a href="/contact" className="underline hover:text-gray-600">Contact Us</a>
      </footer>

      {/* Class detail modal */}
      <ClassModal cls={selected?.cls ?? null} specificDate={selected?.specificDate ?? ''} onClose={() => setSelected(null)} />
    </main>
  )
}
