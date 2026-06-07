'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser, UserButton as ClerkUserButton, SignInButton } from '@clerk/nextjs'
import type { DanceClass, Genre } from '@/lib/types'
import { GENRE_COLORS, STUDIO_LOCATIONS, DAYS } from '@/lib/types'
import { ClassModal } from '@/components/ClassModal'

// ── Design tokens ──────────────────────────────────────────────────────────

const GENRE_CHIPS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'Hip-hop/Street',        label: 'Hip-hop'    },
  { key: 'Ballet/Contemporary',   label: 'Ballet'     },
  { key: 'K-pop',                 label: 'K-pop'      },
  { key: 'Jazz Funk/Commercial',  label: 'Commercial' },
  { key: 'Jazz/Musical Theatre',  label: 'Jazz / MT'  },
  { key: 'Heels',                 label: 'Heels'      },
  { key: 'Afro',                  label: 'Afro'       },
  { key: 'Latin/Salsa/Reggaeton', label: 'Latin'      },
  { key: 'Other',                 label: 'Other'      },
]

const TIME_CHIPS = [
  { key: 'all',       label: 'All Times',  hint: ''          },
  { key: 'morning',   label: 'Morning',    hint: 'before noon' },
  { key: 'afternoon', label: 'Afternoon',  hint: 'noon–5pm'  },
  { key: 'evening',   label: 'Evening',    hint: 'after 5pm' },
]

// ── Helpers ─────────────────────────────────────────────────────────────────

function getWeekDates() {
  const today = new Date()
  const dow = today.getDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)

  // Mon (1) → Sun (0, shown as 7th slot)
  const order = [1, 2, 3, 4, 5, 6, 0]
  return order.map((d, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    const dd = String(date.getDate()).padStart(2, '0')
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    return {
      dow: d,
      label: DAYS[d],
      dateLabel: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      iso: `${date.getFullYear()}-${mm}-${dd}`,
    }
  })
}

const WEEK_DATES = getWeekDates()

function defaultDay() {
  const d = new Date().getDay()
  // If Sunday (0), show Monday (1)
  return d === 0 ? 1 : d
}

function matchesTimeOfDay(startTime: string, tod: string): boolean {
  if (tod === 'all') return true
  const [h, m] = startTime.split(':').map(Number)
  const mins = h * 60 + (m || 0)
  if (tod === 'morning')   return mins < 720
  if (tod === 'afternoon') return mins >= 720 && mins < 1020
  return mins >= 1020
}

function dur(start: string, end: string): string {
  const [h1, m1] = start.split(':').map(Number)
  const [h2, m2] = end.split(':').map(Number)
  const mins = (h2 * 60 + (m2 || 0)) - (h1 * 60 + (m1 || 0))
  const h = Math.floor(mins / 60), m = mins % 60
  return (h ? h + 'h' : '') + (m ? m + 'm' : '') || '—'
}

// ── Sub-components ───────────────────────────────────────────────────────────

function AvatarButton() {
  const { isLoaded, isSignedIn } = useUser()
  if (!isLoaded) return <div style={{ width: 38, height: 38 }} />

  if (!isSignedIn) {
    return (
      <SignInButton mode="redirect">
        <button style={{
          background: 'var(--panel2)',
          border: '1px solid var(--line)',
          borderRadius: '999px',
          padding: '7px 16px',
          fontFamily: 'inherit',
          fontWeight: 800,
          fontSize: '12px',
          color: 'var(--ink)',
          cursor: 'pointer',
        }}>
          Sign in
        </button>
      </SignInButton>
    )
  }

  return <ClerkUserButton />
}

function Chip({
  label, active, dot, hint, onClick,
}: {
  label: string; active: boolean; dot?: string; hint?: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: '0 0 auto',
        border: `1px solid ${active ? 'var(--chip-on)' : 'var(--line)'}`,
        background: active ? 'var(--chip-on)' : 'transparent',
        color: active ? '#fff' : 'var(--muted)',
        fontFamily: 'inherit',
        fontWeight: 800,
        fontSize: '11.5px',
        padding: '7px 13px',
        borderRadius: '999px',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'background .12s, color .12s, border-color .12s',
      }}
    >
      {dot && (
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: dot, display: 'inline-block', flexShrink: 0,
        }} />
      )}
      {label}
      {hint && (
        <small style={{ opacity: 0.62, fontWeight: 700, fontSize: '10px' }}>{hint}</small>
      )}
    </button>
  )
}

function TimelineRow({
  cls,
  isSaved,
  onOpen,
  onSave,
}: {
  cls: DanceClass
  isSaved: boolean
  onOpen: () => void
  onSave: (cls: DanceClass) => void
}) {
  const color = GENRE_COLORS[cls.genre] ?? '#888'
  const loc = STUDIO_LOCATIONS[cls.studioName]

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
      {/* Time gutter */}
      <div style={{
        flexShrink: 0, width: '46px', textAlign: 'right', paddingTop: '14px',
      }}>
        <div style={{ fontFamily: 'var(--font-unbounded, sans-serif)', fontWeight: 500, fontSize: '12px', color: 'var(--ink)' }}>
          {cls.startTime}
        </div>
        <div style={{ fontWeight: 800, fontSize: '10px', color: 'var(--muted)', marginTop: '1px' }}>
          {dur(cls.startTime, cls.endTime)}
        </div>
      </div>

      {/* Rail */}
      <div style={{
        flexShrink: 0, width: '16px', position: 'relative',
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute', top: 0, bottom: 0, width: '2px',
          background: `repeating-linear-gradient(var(--line) 0 6px, transparent 6px 12px)`,
        }} />
        <div style={{
          width: '14px', height: '14px', borderRadius: '50%',
          marginTop: '17px', position: 'relative', zIndex: 2,
          background: color,
          border: '3px solid #FBD3A6',
          boxShadow: `0 0 12px ${color}`,
        }} />
      </div>

      {/* Card */}
      <div
        style={{
          flex: 1, minWidth: 0,
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: '18px',
          padding: '13px 14px',
          marginBottom: '14px',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'transform .12s',
        }}
        onClick={onOpen}
        onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(.98)' }}
        onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = '' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = '' }}
      >
        {/* Glow blob */}
        <div style={{
          position: 'absolute', left: '-30px', top: '-20px',
          width: '90px', height: '90px', borderRadius: '50%',
          background: color, filter: 'blur(26px)', opacity: 0.22, pointerEvents: 'none',
        }} />

        {/* Save button */}
        <button
          onClick={e => { e.stopPropagation(); onSave(cls) }}
          aria-label={isSaved ? 'Unsave class' : 'Save class'}
          style={{
            position: 'absolute', top: '11px', right: '11px', zIndex: 3,
            border: '1px solid var(--line)', background: 'var(--panel2)',
            width: '34px', height: '34px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isSaved ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer',
            transition: 'transform .12s, color .12s',
          }}
          onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(.88)' }}
          onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = '' }}
        >
          <svg viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z" />
          </svg>
        </button>

        {/* Genre badge */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          fontWeight: 800, fontSize: '10px', letterSpacing: '.5px',
          textTransform: 'uppercase', padding: '4px 9px', borderRadius: '999px',
          background: color + '22', color, border: `1px solid ${color}55`,
          position: 'relative',
        }}>
          {cls.genre}
        </span>

        {/* Title */}
        <div style={{
          fontFamily: 'var(--font-unbounded, sans-serif)', fontWeight: 500,
          fontSize: '13.5px', lineHeight: 1.2, marginTop: '8px',
          paddingRight: '42px', position: 'relative', color: 'var(--ink)',
        }}>
          {cls.className}
        </div>

        {/* Teacher */}
        <div style={{ color: 'var(--muted)', fontWeight: 700, fontSize: '11.5px', marginTop: '4px', position: 'relative' }}>
          {cls.instructor}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          marginTop: '9px', fontWeight: 800, fontSize: '10.5px', position: 'relative',
        }}>
          <span style={{ color }}>📍 {cls.studioName}</span>
          {loc && (
            <span style={{ color: 'var(--muted)', fontWeight: 700 }}>· {loc.label}</span>
          )}
          <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontWeight: 700 }}>
            {cls.startTime}–{cls.endTime}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [classes, setClasses] = useState<DanceClass[]>([])
  const [studios, setStudios] = useState<string[]>([])
  const [selectedDay, setSelectedDay] = useState<number>(defaultDay)
  const [timeOfDay, setTimeOfDay] = useState('all')
  const [filterDim, setFilterDim] = useState<'genre' | 'studio'>('genre')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [selectedStudio, setSelectedStudio] = useState('all')
  const [loading, setLoading] = useState(true)
  const [sheet, setSheet] = useState<{ cls: DanceClass; date: string } | null>(null)
  const [signinSheet, setSigninSheet] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  const { isSignedIn } = useUser()

  const fetchClasses = useCallback(async (day: number, studio: string) => {
    setLoading(true)
    const params = new URLSearchParams({ day: String(day) })
    if (studio) params.set('studio', studio)
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

  // Load studios list once
  useEffect(() => {
    fetch('/api/classes')
      .then(r => r.json())
      .then((all: DanceClass[]) => {
        setStudios([...new Set(all.map((c: DanceClass) => c.studioName))].sort())
      })
      .catch(console.error)
  }, [])

  // Load saved class IDs when signed in
  useEffect(() => {
    if (!isSignedIn) { setSavedIds(new Set()); return }
    fetch('/api/saved')
      .then(r => r.json())
      .then((data: { classId: string }[]) => {
        if (Array.isArray(data)) setSavedIds(new Set(data.map(d => d.classId)))
      })
      .catch(console.error)
  }, [isSignedIn])

  useEffect(() => {
    fetchClasses(selectedDay, selectedStudio === 'all' ? '' : selectedStudio)
  }, [selectedDay, selectedStudio, fetchClasses])

  const displayed = classes
    .filter(c => matchesTimeOfDay(c.startTime, timeOfDay))
    .filter(c => selectedGenre === 'all' || c.genre === selectedGenre)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const dayInfo = WEEK_DATES.find(d => d.dow === selectedDay)
  const studioChips = ['all', ...studios]

  async function handleSave(cls: DanceClass) {
    if (!isSignedIn) { setSigninSheet(true); return }
    // Optimistically toggle
    setSavedIds(prev => {
      const next = new Set(prev)
      if (next.has(cls.id)) next.delete(cls.id); else next.add(cls.id)
      return next
    })
    try {
      await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cls }),
      })
    } catch (e) {
      // Revert on failure
      setSavedIds(prev => {
        const next = new Set(prev)
        if (next.has(cls.id)) next.delete(cls.id); else next.add(cls.id)
        return next
      })
      console.error(e)
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header style={{
        padding: '24px 18px 0',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(252,239,180,.72)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}>
        <div style={{ maxWidth: '512px', margin: '0 auto' }}>

          {/* Brand row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4px' }}>
            <img src="/logo-cropped.png" alt="Dancetify" style={{ height: '36px', width: 'auto' }} />
            <AvatarButton />
          </div>

          {/* Day pills */}
          <div className="no-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '12px 0 4px' }}>
            {WEEK_DATES.map(d => {
              const active = selectedDay === d.dow
              return (
                <button
                  key={d.dow}
                  onClick={() => setSelectedDay(d.dow)}
                  style={{
                    flex: '0 0 auto',
                    border: active ? 'none' : '1px solid var(--line)',
                    background: active
                      ? 'linear-gradient(135deg, var(--accent), #ED8636)'
                      : 'var(--panel)',
                    color: active ? '#fff' : 'var(--muted)',
                    fontFamily: 'var(--font-unbounded, sans-serif)',
                    fontWeight: 500,
                    fontSize: '11px',
                    padding: '9px 14px',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    cursor: 'pointer',
                    boxShadow: active ? '0 0 22px rgba(237,72,137,.4)' : 'none',
                    transition: 'background .15s, box-shadow .15s',
                  }}
                >
                  <span>{d.label}</span>
                  <span style={{ fontWeight: 400, fontSize: '10.5px', opacity: 0.8, whiteSpace: 'nowrap' }}>
                    {d.dateLabel}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Time-of-day chips */}
          <div className="no-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '8px 0 2px' }}>
            {TIME_CHIPS.map(t => (
              <Chip
                key={t.key}
                label={t.label}
                hint={t.hint}
                active={timeOfDay === t.key}
                onClick={() => setTimeOfDay(t.key)}
              />
            ))}
          </div>

          {/* Filter dimension tabs */}
          <div style={{
            display: 'flex', gap: '4px',
            background: 'var(--panel)', border: '1px solid var(--line)',
            borderRadius: '999px', padding: '4px', marginTop: '10px',
            width: 'fit-content',
          }}>
            {(['genre', 'studio'] as const).map(dim => (
              <button
                key={dim}
                onClick={() => setFilterDim(dim)}
                style={{
                  border: 'none',
                  background: filterDim === dim ? 'var(--chip-on)' : 'transparent',
                  color: filterDim === dim ? '#fff' : 'var(--muted)',
                  fontFamily: 'inherit',
                  fontWeight: 800,
                  fontSize: '11px',
                  padding: '6px 16px',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  transition: 'background .12s, color .12s',
                }}
              >
                {dim === 'genre' ? 'Genre' : 'Studio'}
              </button>
            ))}
          </div>

          {/* Filter chips */}
          <div className="no-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '8px 0 10px' }}>
            {filterDim === 'genre'
              ? GENRE_CHIPS.map(g => (
                  <Chip
                    key={g.key}
                    label={g.label}
                    active={selectedGenre === g.key}
                    dot={g.key === 'all' ? undefined : GENRE_COLORS[g.key as Genre]}
                    onClick={() => setSelectedGenre(g.key)}
                  />
                ))
              : studioChips.map(s => (
                  <Chip
                    key={s}
                    label={s === 'all' ? 'All studios' : s}
                    active={selectedStudio === s}
                    onClick={() => setSelectedStudio(s)}
                  />
                ))
            }
          </div>
        </div>
      </header>

      {/* ── Scroll area ─────────────────────────────────────────────── */}
      <div style={{ padding: '4px 18px 112px', maxWidth: '512px', margin: '0 auto' }}>

        {/* Section label */}
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          margin: '8px 2px 4px',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-unbounded, sans-serif)',
            fontWeight: 500, fontSize: '15px', color: 'var(--ink)',
          }}>
            {dayInfo ? `${dayInfo.label} ${dayInfo.dateLabel}` : 'Classes'}
          </h2>
          <span style={{ color: 'var(--muted)', fontWeight: 800, fontSize: '11.5px' }}>
            {loading ? '…' : `${displayed.length} classes`}
          </span>
        </div>

        {/* Timeline */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              border: '2.5px solid var(--accent)', borderTopColor: 'transparent',
              animation: 'spin 0.7s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : displayed.length === 0 ? (
          <p style={{
            textAlign: 'center', color: 'var(--muted)',
            fontWeight: 700, padding: '50px 20px',
          }}>
            Nothing on this slot — switch it up…
          </p>
        ) : (
          <div style={{ paddingTop: '10px' }}>
            {displayed.map(cls => {
              const specificDate = cls.classDate ?? (dayInfo?.iso ?? '')
              return (
                <TimelineRow
                  key={cls.id}
                  cls={cls}
                  isSaved={savedIds.has(cls.id)}
                  onOpen={() => setSheet({ cls, date: specificDate })}
                  onSave={handleSave}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* ── Class detail bottom sheet ────────────────────────────────── */}
      <ClassModal
        cls={sheet?.cls ?? null}
        specificDate={sheet?.date ?? ''}
        onClose={() => setSheet(null)}
      />

      {/* ── Sign-in bottom sheet ─────────────────────────────────────── */}
      {signinSheet && (
        <SigninSheet onClose={() => setSigninSheet(false)} />
      )}
    </div>
  )
}

// ── Sign-in sheet ──────────────────────────────────────────────────────────

function SigninSheet({ onClose }: { onClose: () => void }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setShow(true)))
  }, [])
  function close() {
    setShow(false)
    setTimeout(onClose, 340)
  }

  return (
    <>
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
        }}
      />
      {/* Sheet */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 49,
        borderRadius: '30px 30px 0 0',
        background: 'var(--sheet-bg)',
        borderTop: '1px solid var(--line)',
        transform: show ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform .32s cubic-bezier(.22,1,.36,1)',
        padding: '10px 22px 40px',
        maxWidth: '512px',
        margin: '0 auto',
      }}>
        {/* Hglow */}
        <div style={{
          position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
          width: '240px', height: '120px', borderRadius: '50%',
          background: 'var(--accent)', filter: 'blur(50px)', opacity: .5, pointerEvents: 'none',
        }} />
        {/* Grab handle */}
        <div style={{ width: '44px', height: '5px', borderRadius: '99px', background: 'rgba(53,43,61,.2)', margin: '4px auto 14px' }} />
        {/* Head */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <span style={{
            display: 'inline-flex', fontWeight: 800, fontSize: '10px', letterSpacing: '.5px',
            textTransform: 'uppercase', padding: '4px 9px', borderRadius: '999px',
            background: 'var(--accent)22', color: 'var(--accent)',
            border: '1px solid var(--accent)55',
          }}>
            ♡ Save class
          </span>
          <button
            onClick={close}
            style={{
              border: 'none', width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--panel2)', color: 'var(--ink)', fontSize: '14px', cursor: 'pointer',
            }}
          >✕</button>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-unbounded, sans-serif)', fontWeight: 500, fontSize: '20px',
          lineHeight: 1.15, marginTop: '10px', color: 'var(--ink)', position: 'relative',
        }}>
          Sign in to save
        </h1>
        <p style={{ color: 'var(--muted)', fontWeight: 700, fontSize: '12.5px', marginTop: '4px', position: 'relative' }}>
          Save classes to your favourites and keep track of every class you take.
        </p>
        <SignInButton mode="redirect">
          <button style={{
            width: '100%', border: 'none', color: '#fff',
            fontFamily: 'var(--font-unbounded, sans-serif)', fontWeight: 600, fontSize: '14px',
            padding: '16px', borderRadius: '16px', marginTop: '20px', cursor: 'pointer',
            background: `linear-gradient(120deg, var(--accent), #9B6DFF)`,
            boxShadow: '0 0 28px rgba(237,72,137,.5)',
          }}>
            Sign in to save →
          </button>
        </SignInButton>
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontWeight: 700, fontSize: '11.5px', marginTop: '12px' }}>
          New to Dancetify?{' '}
          <a href="/sign-up" style={{ color: 'var(--ink)', fontWeight: 800 }}>Create an account</a>
        </p>
      </div>
    </>
  )
}
