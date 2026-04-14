'use client'

import { useState } from 'react'
import { DAYS } from '@/lib/types'
import type { DanceClass } from '@/lib/types'
import { ClassCard } from './ClassCard'

interface Props {
  classes: DanceClass[]
  onClassClick: (cls: DanceClass, specificDate: string) => void
}

function getMonday(weekOffset = 0): Date {
  const today = new Date()
  const dow = today.getDay()
  const diffToMonday = dow === 0 ? -6 : 1 - dow
  const monday = new Date(today)
  monday.setDate(today.getDate() + diffToMonday + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function getDateForDay(dayOfWeek: number, weekOffset: number): Date {
  const monday = getMonday(weekOffset)
  const offsetFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const d = new Date(monday)
  d.setDate(monday.getDate() + offsetFromMonday)
  return d
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] // Mon → Sun

export function Timetable({ classes, onClassClick }: Props) {
  const [expanded, setExpanded] = useState<string[]>([])
  const [activeWeek, setActiveWeek] = useState(0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const toggle = (key: string) =>
    setExpanded(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <p className="text-4xl mb-3">🕺</p>
        <p className="text-lg">No classes found</p>
        <p className="text-sm mt-1">Try adjusting your filters</p>
      </div>
    )
  }

  const activeDays = DAY_ORDER.filter(d => classes.some(c => c.dayOfWeek === d))

  return (
    <>
      {/* Desktop: single horizontal scroll across both weeks */}
      <div className="hidden md:block overflow-x-auto pb-3">
        <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
          {[0, 1].map(weekOffset => (
            activeDays.map(day => {
              const date = getDateForDay(day, weekOffset)
              const dateStr = formatISODate(date)
              const dayclasses = classes.filter(c => c.dayOfWeek === day && (!c.classDate || c.classDate === dateStr)).sort((a, b) => a.startTime.localeCompare(b.startTime))
              const isFirstDayOfWeek = day === activeDays[0]
              return (
                <div key={`${weekOffset}-${day}`} style={{ width: '200px', flexShrink: 0 }}>
                  {isFirstDayOfWeek && (
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      {weekOffset === 0 ? 'This Week' : 'Next Week'}
                    </p>
                  )}
                  <div className="text-center mb-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{DAYS[day]}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(date)}</p>
                  </div>
                  <div className="space-y-2">
                    {dayclasses.map(cls => {
                      const specificDate = cls.classDate ?? formatISODate(getDateForDay(cls.dayOfWeek, weekOffset))
                      return <ClassCard key={`${weekOffset}-${cls.id}`} cls={cls} specificDate={specificDate} onClick={onClassClick} />
                    })}
                  </div>
                </div>
              )
            })
          ))}
        </div>
      </div>

      {/* Mobile: week toggle tabs + accordion */}
      <div className="md:hidden">
        {/* Week toggle */}
        <div className="flex gap-2 mb-4">
          {['This Week', 'Next Week'].map((label, i) => (
            <button
              key={i}
              onClick={() => setActiveWeek(i)}
              className="flex-1 py-2 rounded-2xl text-sm font-bold transition-all"
              style={{
                backgroundColor: activeWeek === i ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.3)',
                border: '1.5px solid rgba(255,255,255,0.7)',
                color: activeWeek === i ? '#374151' : '#9ca3af',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Day accordion for selected week */}
        <div className="space-y-3">
          {DAY_ORDER.filter(d => classes.some(c => c.dayOfWeek === d)).map(day => {
            const key = `${activeWeek}-${day}`
            const date = getDateForDay(day, activeWeek)
            const dateStr = formatISODate(date)
            const dayclasses = classes.filter(c => c.dayOfWeek === day && (!c.classDate || c.classDate === dateStr)).sort((a, b) => a.startTime.localeCompare(b.startTime))
            const isOpen = expanded.includes(key)
            const isToday = date.toDateString() === today.toDateString()

            return (
              <div key={key} className="rounded-2xl overflow-hidden" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(255,255,255,0.45)', border: '1.5px solid rgba(255,255,255,0.7)' }}>
                <button
                  onClick={() => toggle(key)}
                  className="w-full flex items-center justify-between px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold uppercase tracking-widest ${isToday ? 'text-pink-400' : 'text-gray-600'}`}>
                      {DAYS[day]}
                    </span>
                    <span className="text-sm text-gray-400">{formatDate(date)}</span>
                    {isToday && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-400 uppercase tracking-wide">Today</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{dayclasses.length} classes</span>
                    <span className="text-gray-400 text-sm" style={{ display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>›</span>
                  </div>
                </button>

                {isOpen && dayclasses.length > 0 && (
                  <div className="px-3 pb-3 space-y-2">
                    {dayclasses.map(cls => {
                      const specificDate = cls.classDate ?? formatISODate(getDateForDay(cls.dayOfWeek, activeWeek))
                      return <ClassCard key={`${key}-${cls.id}`} cls={cls} specificDate={specificDate} onClick={onClassClick} />
                    })}
                  </div>
                )}

                {isOpen && dayclasses.length === 0 && (
                  <p className="px-5 pb-4 text-sm text-gray-400">No classes this day</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
