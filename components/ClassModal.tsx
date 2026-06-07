'use client'

import { useState, useEffect } from 'react'
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

  // Track what's displayed so we can animate out before unmounting
  const [displayed, setDisplayed] = useState<DanceClass | null>(cls)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (cls) {
      setDisplayed(cls)
      setBookingState('idle')
      // Double rAF ensures the translate(110%) starting state renders before we transition
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setShow(true))
      )
    } else {
      setShow(false)
      const t = setTimeout(() => setDisplayed(null), 340)
      return () => clearTimeout(t)
    }
  }, [cls])

  function close() {
    setShow(false)
    setTimeout(onClose, 340)
  }

  async function handleBook() {
    if (!displayed) return
    window.open(displayed.bookingUrl, '_blank')
    if (!isSignedIn) return
    setBookingState('loading')
    try {
      await fetch('/api/log/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: displayed.id,
          studioName: displayed.studioName,
          className: displayed.className,
          instructor: displayed.instructor,
          genre: displayed.genre,
          startTime: displayed.startTime,
          endTime: displayed.endTime,
          classDate: specificDate,
        }),
      })
      setBookingState('done')
      setShowToast(true)
    } catch {
      setBookingState('idle')
    }
  }

  if (!displayed) return showToast ? <BookingToast /> : null

  const color = GENRE_COLORS[displayed.genre] ?? '#888'
  const loc = STUDIO_LOCATIONS[displayed.studioName]
  const dayLabel = DAYS[displayed.dayOfWeek]

  return (
    <>
      {showToast && <BookingToast />}

      {/* Scrim */}
      <div
        onClick={close}
        style={{
          position: 'fixed', inset: 0, zIndex: 48,
          background: 'rgba(8,4,20,.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: show ? 1 : 0,
          transition: 'opacity .25s',
          pointerEvents: show ? 'auto' : 'none',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          left: 0, right: 0, bottom: 0,
          zIndex: 49,
          borderRadius: '30px 30px 0 0',
          background: 'var(--sheet-bg)',
          borderTop: '1px solid var(--line)',
          padding: '10px 22px 40px',
          overflow: 'hidden',
          transform: show ? 'translateY(0)' : 'translateY(110%)',
          transition: 'transform .32s cubic-bezier(.22,1,.36,1)',
          maxWidth: '512px',
          margin: '0 auto',
        }}
      >
        {/* Hglow */}
        <div style={{
          position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
          width: '240px', height: '120px', borderRadius: '50%',
          background: color, filter: 'blur(50px)', opacity: .5, pointerEvents: 'none',
        }} />

        {/* Grab handle */}
        <div style={{
          width: '44px', height: '5px', borderRadius: '99px',
          background: 'rgba(53,43,61,.2)', margin: '4px auto 14px',
        }} />

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <span style={{
            display: 'inline-flex', fontWeight: 800, fontSize: '10px',
            letterSpacing: '.5px', textTransform: 'uppercase',
            padding: '4px 9px', borderRadius: '999px',
            background: color + '22', color, border: `1px solid ${color}55`,
          }}>
            {displayed.genre}
          </span>
          <button
            onClick={close}
            style={{
              border: 'none', width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--panel2)', color: 'var(--ink)', fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: 'var(--font-unbounded, sans-serif)', fontWeight: 500,
          fontSize: '23px', lineHeight: 1.15, marginTop: '10px',
          color: 'var(--ink)', position: 'relative',
        }}>
          {displayed.className}
        </h1>
        <p style={{ color: 'var(--muted)', fontWeight: 700, fontSize: '14px', marginTop: '4px', position: 'relative' }}>
          with {displayed.instructor}
        </p>

        {/* Detail cells 2×2 */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
          margin: '18px 0 6px', position: 'relative',
        }}>
          <Cell k="Studio"   v={displayed.studioName} />
          <Cell k="When"     v={`${dayLabel} · ${displayed.startTime}–${displayed.endTime}`} />
          <Cell k="Location" v={loc ? loc.label : (displayed.location ?? '—')} />
          <Cell k="Level"    v={displayed.level} />
        </div>

        {/* Price row */}
        {displayed.price && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            margin: '14px 0 4px', position: 'relative',
          }}>
            <span style={{ color: 'var(--muted)', fontWeight: 800, fontSize: '13px' }}>Price per class</span>
            <span style={{
              fontFamily: 'var(--font-unbounded, sans-serif)', fontWeight: 600,
              fontSize: '26px', color,
            }}>
              {displayed.price}
            </span>
          </div>
        )}

        {/* Book Now button */}
        <button
          onClick={handleBook}
          disabled={bookingState === 'loading'}
          style={{
            width: '100%', border: 'none', color: '#fff',
            fontFamily: 'var(--font-unbounded, sans-serif)', fontWeight: 600, fontSize: '16px',
            padding: '16px', borderRadius: '16px', marginTop: '8px', cursor: 'pointer',
            background: `linear-gradient(120deg, ${color}, var(--accent))`,
            boxShadow: `0 0 28px ${color}88`,
            opacity: bookingState === 'loading' ? 0.6 : 1,
            transition: 'opacity .15s',
          }}
        >
          {bookingState === 'loading' ? 'Saving…' : 'Book Now →'}
        </button>

        {/* Sign-in hint */}
        {!isSignedIn && (
          <p style={{
            textAlign: 'center', color: 'var(--muted)',
            fontWeight: 700, fontSize: '12.5px', marginTop: '12px',
          }}>
            <a href="/sign-in" style={{ color: 'var(--ink)', fontWeight: 800 }}>Sign in</a>
            {' '}to save your progress
          </p>
        )}

        {displayed.notes && (
          <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '12px', fontStyle: 'italic', position: 'relative' }}>
            {displayed.notes}
          </p>
        )}
      </div>
    </>
  )
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div style={{
      background: 'var(--panel)', border: '1px solid var(--line)',
      borderRadius: '16px', padding: '12px 13px',
    }}>
      <div style={{ color: 'var(--muted)', fontWeight: 800, fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '.5px' }}>
        {k}
      </div>
      <div style={{ fontWeight: 800, fontSize: '14px', marginTop: '4px', color: 'var(--ink)' }}>
        {v}
      </div>
    </div>
  )
}
