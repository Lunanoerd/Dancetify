import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { StatsCard } from '@/components/StatsCard'
import { DashboardCharts } from '@/components/DashboardCharts'
import { GENRE_COLORS } from '@/lib/types'

function parseHours(startTime: string, endTime: string): number {
  try {
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    const startMins = sh * 60 + (sm || 0)
    let endMins = eh * 60 + (em || 0)
    if (endMins < startMins) endMins += 24 * 60
    return (endMins - startMins) / 60
  } catch {
    return 1
  }
}

function isoWeek(dateStr: string): string {
  const d = new Date(dateStr)
  const jan4 = new Date(d.getFullYear(), 0, 4)
  const weekNum = Math.ceil(((d.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

const panel: React.CSSProperties = {
  background: 'var(--panel)',
  border: '1px solid var(--line)',
  borderRadius: '20px',
  padding: '16px',
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) return null

  const [attended, pending, manual] = await Promise.all([
    db.bookedClass.findMany({ where: { userId, attended: 'yes' } }),
    db.bookedClass.findMany({ where: { userId, attended: 'pending' }, orderBy: { classDate: 'asc' } }),
    db.manualClass.findMany({ where: { userId } }),
  ])

  const now = new Date()
  const thisMonth = now.toISOString().slice(0, 7)
  const thisYear = String(now.getFullYear())

  const allClasses = [
    ...attended.map(c => ({
      date: c.classDate, genre: c.genre, studio: c.studioName,
      instructor: c.instructor, startTime: c.startTime, endTime: c.endTime,
      isManual: false, id: c.id, className: c.className,
    })),
    ...manual.map(c => ({
      date: c.classDate, genre: c.genre, studio: c.studioName,
      instructor: c.instructor, startTime: c.startTime ?? '', endTime: c.endTime ?? '',
      isManual: true, id: c.id, className: '',
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  const total = allClasses.length
  const thisMonthCount = allClasses.filter(c => c.date.startsWith(thisMonth)).length
  const thisYearCount = allClasses.filter(c => c.date.startsWith(thisYear)).length
  const totalHours = Math.round(allClasses.reduce((sum, c) => {
    return sum + (c.startTime && c.endTime ? parseHours(c.startTime, c.endTime) : 1)
  }, 0) * 10) / 10

  const genreCounts: Record<string, number> = {}
  const studioCounts: Record<string, number> = {}
  const instructorCounts: Record<string, number> = {}
  const weekCounts: Record<string, number> = {}
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  const twoWeeksAgoStr = twoWeeksAgo.toISOString().slice(0, 10)

  for (const c of allClasses) {
    genreCounts[c.genre] = (genreCounts[c.genre] ?? 0) + 1
    studioCounts[c.studio] = (studioCounts[c.studio] ?? 0) + 1
    if (c.instructor) instructorCounts[c.instructor] = (instructorCounts[c.instructor] ?? 0) + 1
    if (c.date >= twoWeeksAgoStr) {
      const week = isoWeek(c.date)
      weekCounts[week] = (weekCounts[week] ?? 0) + 1
    }
  }

  const topInstructor = Object.entries(instructorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
  const wrappedStats = {
    total, totalHours,
    topGenre: Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—',
    topStudio: Object.entries(studioCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—',
    topInstructor,
  }

  const wrappedGoal = 10
  const wrappedPct = Math.min(Math.round((totalHours / wrappedGoal) * 100), 100)

  return (
    <div style={{ padding: '24px 18px 112px', maxWidth: '512px', margin: '0 auto' }}>

      {/* Page title */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{
          fontFamily: 'var(--font-unbounded, sans-serif)',
          fontWeight: 600, fontSize: '23px', color: 'var(--ink)',
        }}>
          My Progress
        </h1>
        <p style={{ color: 'var(--muted)', fontWeight: 700, fontSize: '13px', marginTop: '2px' }}>
          every move on the floor, tracked
        </p>
      </div>

      {/* Stats grid 2×2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        <StatsCard label="Total classes" value={total} />
        <StatsCard label="This month"    value={thisMonthCount} />
        <StatsCard label="This year"     value={thisYearCount} />
        <StatsCard label="Hours danced"  value={`${totalHours}h`} sub="estimated" />
      </div>

      {/* Wrapped promo card */}
      <div style={{
        borderRadius: '20px', padding: '18px', marginBottom: '12px', color: '#fff',
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(120deg, var(--accent), #9B6DFF)',
        boxShadow: '0 0 34px rgba(237,72,137,.28)',
      }}>
        <p style={{ fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.6px', opacity: .95 }}>
          ✦ Dancetify Wrapped
        </p>
        <p style={{
          fontFamily: 'var(--font-unbounded, sans-serif)', fontWeight: 500,
          fontSize: '17px', margin: '5px 0 12px',
        }}>
          {totalHours >= wrappedGoal
            ? 'You\'ve unlocked Wrapped!'
            : `Unlocks at ${wrappedGoal}h danced`}
        </p>
        <div style={{ height: '11px', borderRadius: '99px', background: 'rgba(0,0,0,.25)', overflow: 'hidden' }}>
          <div style={{ display: 'block', height: '100%', background: '#fff', borderRadius: '99px', width: `${wrappedPct}%`, boxShadow: '0 0 12px #fff' }} />
        </div>
        <p style={{ fontWeight: 800, fontSize: '12px', marginTop: '8px' }}>
          {totalHours}h of {wrappedGoal}h · {wrappedPct}% there
        </p>
      </div>

      {/* Favourite instructor */}
      {topInstructor !== '—' && (
        <div style={{ ...panel, marginBottom: '12px' }}>
          <h3 style={{ fontWeight: 800, fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '12px' }}>
            Favourite instructor
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '15px', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent), #ED8636)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
              fontFamily: 'var(--font-unbounded, sans-serif)', fontWeight: 600, fontSize: '18px',
            }}>
              {topInstructor.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-unbounded, sans-serif)', fontWeight: 500, fontSize: '17px', color: 'var(--ink)' }}>
                {topInstructor}
              </div>
              <div style={{ color: 'var(--muted)', fontWeight: 700, fontSize: '12.5px' }}>
                {instructorCounts[topInstructor]} class{instructorCounts[topInstructor] !== 1 ? 'es' : ''} attended
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <DashboardCharts
        weekCounts={weekCounts}
        genreCounts={genreCounts}
        studioCounts={studioCounts}
        wrappedStats={wrappedStats}
        genreColors={GENRE_COLORS as Record<string, string>}
      />

      {/* Pending bookings */}
      {pending.length > 0 && (
        <div style={{ ...panel, marginTop: '12px' }}>
          <h3 style={{ fontWeight: 800, fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '12px' }}>
            Booked — awaiting confirmation
          </h3>
          {pending.map(c => (
            <div
              key={c.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 0', borderBottom: '1px solid var(--line)',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--ink)' }}>{c.className}</div>
                <div style={{ color: 'var(--muted)', fontWeight: 700, fontSize: '11.5px', marginTop: '1px' }}>
                  {c.studioName} · {c.instructor}
                </div>
              </div>
              <span style={{
                fontWeight: 800, fontSize: '9.5px', color: '#ED8636',
                border: '1px solid #ED8636', padding: '3px 8px',
                borderRadius: '999px', letterSpacing: '.4px', flexShrink: 0,
              }}>
                Pending
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Class log */}
      <div style={{ ...panel, marginTop: '12px' }}>
        <h3 style={{ fontWeight: 800, fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '12px' }}>
          Class log
        </h3>
        {allClasses.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 700 }}>
            No classes logged yet. Book a class or add one manually.
          </p>
        ) : (
          allClasses.map(c => (
            <div
              key={c.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 0', borderBottom: '1px solid var(--line)',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--ink)' }}>
                  {c.className || c.studio}
                </div>
                <div style={{ color: 'var(--muted)', fontWeight: 700, fontSize: '11.5px', marginTop: '1px' }}>
                  {c.className ? `${c.studio} · ${c.instructor}` : c.instructor}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <span style={{ color: 'var(--muted)', fontWeight: 800, fontSize: '11.5px' }}>
                  {c.date.slice(5).replace('-', '/')}
                </span>
                {c.isManual && (
                  <span style={{
                    fontWeight: 800, fontSize: '9.5px', color: '#F7B731',
                    border: '1px solid #F7B731', padding: '3px 8px',
                    borderRadius: '999px', letterSpacing: '.4px',
                  }}>
                    Manual
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
