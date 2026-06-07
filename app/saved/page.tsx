'use client'

import { useEffect, useState } from 'react'
import { useUser, SignInButton } from '@clerk/nextjs'
import { GENRE_COLORS, STUDIO_LOCATIONS, DAYS } from '@/lib/types'
import type { Genre } from '@/lib/types'
import { ClassModal } from '@/components/ClassModal'

interface SavedClass {
  id: string
  classId: string
  studioName: string
  className: string
  instructor: string
  genre: string
  startTime: string
  endTime: string
  dayOfWeek: number
  level: string
  bookingUrl: string
  savedAt: string
}

// Adapt SavedClass into the DanceClass shape ClassModal expects
function toModalCls(s: SavedClass) {
  return {
    id: s.classId,
    studioName: s.studioName,
    studioWebsite: '',
    bookingUrl: s.bookingUrl,
    className: s.className,
    instructor: s.instructor,
    genre: s.genre as Genre,
    level: s.level as import('@/lib/types').Level,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    lastScraped: '',
  }
}

function dur(start: string, end: string): string {
  const [h1, m1] = start.split(':').map(Number)
  const [h2, m2] = end.split(':').map(Number)
  const mins = (h2 * 60 + (m2 || 0)) - (h1 * 60 + (m1 || 0))
  const h = Math.floor(mins / 60), m = mins % 60
  return (h ? h + 'h' : '') + (m ? m + 'm' : '') || '—'
}

export default function SavedPage() {
  const { isLoaded, isSignedIn } = useUser()
  const [saved, setSaved] = useState<SavedClass[]>([])
  const [loading, setLoading] = useState(true)
  const [sheet, setSheet] = useState<SavedClass | null>(null)
  const [removing, setRemoving] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) { setLoading(false); return }

    fetch('/api/saved')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSaved(data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [isLoaded, isSignedIn])

  async function unsave(s: SavedClass) {
    setRemoving(prev => new Set(prev).add(s.id))
    try {
      await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cls: toModalCls(s) }),
      })
      setSaved(prev => prev.filter(x => x.id !== s.id))
    } catch (e) {
      console.error(e)
    } finally {
      setRemoving(prev => { const n = new Set(prev); n.delete(s.id); return n })
    }
  }

  // ── Not signed in ───────────────────────────────────────────────────────
  if (isLoaded && !isSignedIn) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 24px 112px',
      }}>
        <div style={{
          maxWidth: '320px', textAlign: 'center',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '22px', margin: '0 auto 20px',
            background: 'linear-gradient(135deg, var(--accent), #9B6DFF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 32px rgba(237,72,137,.35)',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="34" height="34">
              <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z" />
            </svg>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-unbounded, sans-serif)',
            fontWeight: 500, fontSize: '19px', color: 'var(--ink)', marginBottom: '8px',
          }}>
            Save your favourites
          </h1>
          <p style={{ color: 'var(--muted)', fontWeight: 700, fontSize: '12.5px', lineHeight: 1.5, marginBottom: '24px' }}>
            Sign in to save classes and build your personal shortlist.
          </p>
          <SignInButton mode="redirect">
            <button style={{
              width: '100%', border: 'none', color: '#fff',
              fontFamily: 'var(--font-unbounded, sans-serif)', fontWeight: 600, fontSize: '13.5px',
              padding: '15px', borderRadius: '16px', cursor: 'pointer',
              background: 'linear-gradient(120deg, var(--accent), #9B6DFF)',
              boxShadow: '0 0 28px rgba(237,72,137,.4)',
            }}>
              Sign in →
            </button>
          </SignInButton>
        </div>
      </div>
    )
  }

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '112px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          border: '2.5px solid var(--accent)', borderTopColor: 'transparent',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── Signed in ───────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px 18px 112px', maxWidth: '512px', margin: '0 auto' }}>

      <div style={{ marginBottom: '20px' }}>
        <h1 style={{
          fontFamily: 'var(--font-unbounded, sans-serif)',
          fontWeight: 600, fontSize: '20px', color: 'var(--ink)',
        }}>
          Saved
        </h1>
        <p style={{ color: 'var(--muted)', fontWeight: 700, fontSize: '12px', marginTop: '2px' }}>
          {saved.length === 0 ? 'your shortlist is empty' : `${saved.length} class${saved.length !== 1 ? 'es' : ''} saved`}
        </p>
      </div>

      {saved.length === 0 ? (
        <div style={{
          background: 'var(--panel)', border: '1px solid var(--line)',
          borderRadius: '20px', padding: '40px 24px', textAlign: 'center',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5"
            width="40" height="40" style={{ margin: '0 auto 12px', display: 'block' }}>
            <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z" />
          </svg>
          <p style={{ color: 'var(--muted)', fontWeight: 700, fontSize: '12.5px' }}>
            No saved classes yet
          </p>
          <p style={{ color: 'var(--muted)', fontWeight: 600, fontSize: '11.5px', marginTop: '4px' }}>
            Tap the ♡ on any class to save it here
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {saved.map(s => {
            const color = GENRE_COLORS[s.genre as Genre] ?? '#888'
            const loc = STUDIO_LOCATIONS[s.studioName]
            const isRemoving = removing.has(s.id)

            return (
              <div
                key={s.id}
                onClick={() => setSheet(s)}
                style={{
                  background: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: '18px',
                  padding: '13px 14px',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  opacity: isRemoving ? 0.4 : 1,
                  transition: 'opacity .2s, transform .12s',
                }}
                onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(.98)' }}
                onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = '' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = '' }}
              >
                {/* Glow blob */}
                <div style={{
                  position: 'absolute', left: '-30px', top: '-20px',
                  width: '90px', height: '90px', borderRadius: '50%',
                  background: color, filter: 'blur(26px)', opacity: 0.18, pointerEvents: 'none',
                }} />

                {/* Unsave button */}
                <button
                  onClick={e => { e.stopPropagation(); unsave(s) }}
                  disabled={isRemoving}
                  aria-label="Unsave class"
                  style={{
                    position: 'absolute', top: '11px', right: '11px', zIndex: 3,
                    border: '1px solid var(--line)', background: 'var(--panel2)',
                    width: '34px', height: '34px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent)', cursor: 'pointer',
                    transition: 'transform .12s',
                  }}
                  onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(.88)' }}
                  onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = '' }}
                >
                  {/* Filled heart = saved */}
                  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
                    <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z" />
                  </svg>
                </button>

                {/* Genre badge */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  fontWeight: 800, fontSize: '10px', letterSpacing: '.5px',
                  textTransform: 'uppercase', padding: '4px 9px', borderRadius: '999px',
                  background: color + '22', color, border: `1px solid ${color}55`,
                  position: 'relative',
                }}>
                  {s.genre}
                </span>

                {/* Title */}
                <div style={{
                  fontFamily: 'var(--font-unbounded, sans-serif)', fontWeight: 500,
                  fontSize: '13.5px', lineHeight: 1.2, marginTop: '8px',
                  paddingRight: '42px', color: 'var(--ink)', position: 'relative',
                }}>
                  {s.className}
                </div>

                {/* Teacher */}
                <div style={{ color: 'var(--muted)', fontWeight: 700, fontSize: '11.5px', marginTop: '4px', position: 'relative' }}>
                  {s.instructor}
                </div>

                {/* Footer */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  marginTop: '9px', fontWeight: 800, fontSize: '10.5px', position: 'relative',
                }}>
                  <span style={{ color }}>📍 {s.studioName}</span>
                  {loc && <span style={{ color: 'var(--muted)', fontWeight: 700 }}>· {loc.label}</span>}
                  <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontWeight: 700 }}>
                    {DAYS[s.dayOfWeek]} · {s.startTime}–{s.endTime}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Class detail sheet */}
      {sheet && (
        <ClassModal
          cls={toModalCls(sheet)}
          specificDate=""
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  )
}
