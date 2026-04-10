'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import type { DanceClass } from '@/lib/types'
import { GENRE_COLORS, DAYS, STUDIO_LOCATIONS } from '@/lib/types'
import { BookingToast } from './BookingToast'

interface Props {
  cls: DanceClass | null
  specificDate: string
  onClose: () => void
}

export function ClassModal({ cls, specificDate, onClose }: Props) {
  const { isSignedIn } = useUser()
  const [bookingState, setBookingState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [showToast, setShowToast] = useState(false)

  if (!cls) return null

  const color = GENRE_COLORS[cls.genre]
  const loc = STUDIO_LOCATIONS[cls.studioName]

  async function handleBook() {
    if (!cls) return
    if (!isSignedIn) return

    setBookingState('loading')
    try {
      await fetch('/api/log/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: cls.id,
          studioName: cls.studioName,
          className: cls.className,
          instructor: cls.instructor,
          genre: cls.genre,
          startTime: cls.startTime,
          endTime: cls.endTime,
          classDate: specificDate,
        }),
      })
      setBookingState('done')
      setShowToast(true)
    } catch {
      setBookingState('idle')
    }
    window.open(cls.bookingUrl, '_blank')
  }

  return (
    <>
      {showToast && <BookingToast />}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div
          className="relative z-10 w-full max-w-md rounded-2xl p-6 shadow-2xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)', borderTop: `4px solid ${color}` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl leading-none"
          >
            ✕
          </button>

          <span
            className="inline-block text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-3"
            style={{ backgroundColor: color + '33', color }}
          >
            {cls.genre}
          </span>

          <h2 className="text-xl font-bold text-gray-800 mb-1">{cls.className}</h2>
          <p className="text-gray-500 mb-4">with {cls.instructor}</p>

          <div className="space-y-2 text-sm mb-6">
            <Row label="Studio" value={cls.studioName} />
            <Row label="Day" value={DAYS[cls.dayOfWeek]} />
            <Row label="Time" value={`${cls.startTime} – ${cls.endTime}`} />
            <Row label="Level" value={cls.level} />
            {loc && (
              <div className="flex gap-2">
                <span className="text-gray-400 w-20 shrink-0">Location</span>
                <a
                  href={loc.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-gray-900 underline underline-offset-2"
                >
                  📍 {loc.label}
                </a>
              </div>
            )}
            {cls.price && <Row label="Price" value={cls.price} />}
            {cls.notes && <Row label="Notes" value={cls.notes} />}
          </div>

          {isSignedIn ? (
            <button
              onClick={handleBook}
              disabled={bookingState === 'loading'}
              className="block w-full text-center py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: color }}
            >
              {bookingState === 'loading' ? 'Saving…' : 'Book Now →'}
            </button>
          ) : (
            <div>
              <a
                href={cls.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90 mb-2"
                style={{ backgroundColor: color }}
              >
                Book Now →
              </a>
              <p className="text-center text-xs text-gray-400">
                <a href="/sign-in" className="underline hover:text-gray-600">Sign in</a> to save your progress
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 w-20 shrink-0">{label}</span>
      <span className="text-gray-700">{value}</span>
    </div>
  )
}
