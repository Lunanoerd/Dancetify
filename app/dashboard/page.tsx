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
  const twelveWeeksAgo = new Date()
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 14)
  const twelveWeeksAgoStr = twelveWeeksAgo.toISOString().slice(0, 10)

  for (const c of allClasses) {
    genreCounts[c.genre] = (genreCounts[c.genre] ?? 0) + 1
    studioCounts[c.studio] = (studioCounts[c.studio] ?? 0) + 1
    if (c.instructor) instructorCounts[c.instructor] = (instructorCounts[c.instructor] ?? 0) + 1
    if (c.date >= twelveWeeksAgoStr) {
      const week = isoWeek(c.date)
      weekCounts[week] = (weekCounts[week] ?? 0) + 1
    }
  }

  const topInstructor = Object.entries(instructorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
  const topStudio = Object.entries(studioCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  const wrappedStats = { total, topGenre, topStudio, topInstructor, totalHours }

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard label="Total classes" value={total} />
        <StatsCard label="This month" value={thisMonthCount} />
        <StatsCard label="This year" value={thisYearCount} />
        <StatsCard label="Hours danced" value={`${totalHours}h`} sub="estimated" />
      </div>

      {/* Favourite instructor */}
      {topInstructor !== '—' && (
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.7)' }}
        >
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Favourite instructor</p>
          <p className="text-xl font-bold text-gray-800">{topInstructor}</p>
          <p className="text-xs text-gray-400">{instructorCounts[topInstructor]} classes attended</p>
        </div>
      )}

      {/* Charts */}
      <DashboardCharts weekCounts={weekCounts} genreCounts={genreCounts} studioCounts={studioCounts} wrappedStats={wrappedStats} genreColors={GENRE_COLORS as Record<string, string>} />

      {/* Pending bookings */}
      {pending.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.7)' }}
        >
          <h2 className="text-sm font-bold text-gray-700 mb-1 uppercase tracking-widest">Booked — awaiting confirmation</h2>
          <p className="text-xs text-gray-400 mb-4">After each class you&apos;ll get an email asking if you attended.</p>
          <div className="space-y-2">
            {pending.map(c => (
              <div key={c.id} className="flex items-center justify-between text-sm py-2 border-b border-white/50 last:border-0">
                <div>
                  <span className="font-semibold text-gray-800">{c.className}</span>
                  <span className="text-gray-400 ml-1">· {c.studioName}</span>
                  <span className="text-gray-400 ml-1">· {c.instructor}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <span className="text-gray-400 text-xs">{c.classDate}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-500 uppercase">Pending</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Class log */}
      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.7)' }}
      >
        <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-widest">Class Log</h2>
        {allClasses.length === 0 ? (
          <p className="text-sm text-gray-400">No classes logged yet. Book a class or add one manually.</p>
        ) : (
          <div className="space-y-2">
            {allClasses.map(c => (
              <div key={c.id} className="flex items-center justify-between text-sm py-2 border-b border-white/50 last:border-0">
                <div>
                  <span className="font-semibold text-gray-800">{c.className || c.studio}</span>
                  {c.className && <span className="text-gray-400 ml-1">· {c.studio}</span>}
                  <span className="text-gray-400 ml-1">· {c.instructor}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <span className="text-gray-400 text-xs">{c.date}</span>
                  {c.isManual && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-600 uppercase">Manual</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
