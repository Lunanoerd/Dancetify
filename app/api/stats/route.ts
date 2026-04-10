import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

function parseHours(startTime: string, endTime: string): number {
  try {
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    const startMins = sh * 60 + (sm || 0)
    let endMins = eh * 60 + (em || 0)
    if (endMins < startMins) endMins += 24 * 60 // overnight
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

export async function GET(_request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const [attended, manual] = await Promise.all([
    db.bookedClass.findMany({ where: { userId, attended: 'yes' } }),
    db.manualClass.findMany({ where: { userId } }),
  ])

  const now = new Date()
  const thisMonth = now.toISOString().slice(0, 7) // "YYYY-MM"
  const thisYear = String(now.getFullYear())

  // Combine all attended + manual into a unified log
  const allClasses = [
    ...attended.map(c => ({
      date: c.classDate,
      genre: c.genre,
      studio: c.studioName,
      instructor: c.instructor,
      startTime: c.startTime,
      endTime: c.endTime,
      isManual: false,
      id: c.id,
      className: c.className,
    })),
    ...manual.map(c => ({
      date: c.classDate,
      genre: c.genre,
      studio: c.studioName,
      instructor: c.instructor,
      startTime: c.startTime ?? '',
      endTime: c.endTime ?? '',
      isManual: true,
      id: c.id,
      className: '',
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  const total = allClasses.length
  const thisMonthCount = allClasses.filter(c => c.date.startsWith(thisMonth)).length
  const thisYearCount = allClasses.filter(c => c.date.startsWith(thisYear)).length

  const totalHours = allClasses.reduce((sum, c) => {
    if (c.startTime && c.endTime) return sum + parseHours(c.startTime, c.endTime)
    return sum + 1
  }, 0)

  // Per-genre
  const genreCounts: Record<string, number> = {}
  for (const c of allClasses) {
    genreCounts[c.genre] = (genreCounts[c.genre] ?? 0) + 1
  }

  // Per-studio
  const studioCounts: Record<string, number> = {}
  for (const c of allClasses) {
    studioCounts[c.studio] = (studioCounts[c.studio] ?? 0) + 1
  }

  // Per instructor
  const instructorCounts: Record<string, number> = {}
  for (const c of allClasses) {
    if (c.instructor) {
      instructorCounts[c.instructor] = (instructorCounts[c.instructor] ?? 0) + 1
    }
  }
  const topInstructor = Object.entries(instructorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  // Per week (last 12 weeks)
  const weekCounts: Record<string, number> = {}
  const twelveWeeksAgo = new Date()
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)
  const twelveWeeksAgoStr = twelveWeeksAgo.toISOString().slice(0, 10)

  for (const c of allClasses) {
    if (c.date >= twelveWeeksAgoStr) {
      const week = isoWeek(c.date)
      weekCounts[week] = (weekCounts[week] ?? 0) + 1
    }
  }

  return Response.json({
    total,
    thisMonth: thisMonthCount,
    thisYear: thisYearCount,
    totalHours: Math.round(totalHours * 10) / 10,
    genreCounts,
    studioCounts,
    instructorCounts,
    topInstructor,
    weekCounts,
    log: allClasses,
  })
}
