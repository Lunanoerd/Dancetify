/**
 * The Manor LDN scraper
 * Uses the Lemonbar API directly — no browser needed.
 * Fetches 14 days and deduplicates by class+dayOfWeek+startTime to get the recurring schedule.
 */
import type { DanceClass, Genre, Level } from '@/lib/types'
import { guessGenre, guessLevel } from './utils'

const STUDIO_NAME = 'The Manor LDN'
const STUDIO_WEBSITE = 'https://www.themanorldn.com'
const TIMETABLE_URL = 'https://www.themanorldn.com/timetable'
const API_BASE = 'https://api.lemonbar.uk/api/admin/booking_sessions'

// skill_level_id → Level
const LEVEL_MAP: Record<number, Level> = {
  17:  'BEG/INT',
  19:  'INT/ADV',
  20:  'ADV/PRO',
  457: 'INT/ADV',
  458: 'BEG/INT',
  459: 'INT/ADV',
}

function pad(n: number) { return String(n).padStart(2, '0') }

function isoDate(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

export async function scrape(): Promise<Omit<DanceClass, 'id' | 'lastScraped'>[]> {
  const allClasses: Omit<DanceClass, 'id' | 'lastScraped'>[] = []
  const seenKeys = new Set<string>()

  // Fetch 14 days to cover a full 2-week recurring schedule
  for (let offset = 0; offset < 14; offset++) {
    const date = isoDate(offset)
    const url = `${API_BASE}?dates=%5B%22${date}%22%5D&location_id=1`

    const res = await fetch(url)
    if (!res.ok) continue
    const data = await res.json() as Record<string, any[]>
    const sessions = data[date] ?? []

    for (const s of sessions) {
      if (s.is_hide_from_customer) continue

      const dayOfWeek = new Date(date).getDay()
      const h = s.start_time?.hour ?? 0
      const m = s.start_time?.minutes ?? 0
      const startTime = `${pad(h)}:${pad(m)}`

      const endDate = new Date(s.end_date)
      const endTime = `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`

      const className = s.class_name?.trim() || 'Unknown'
      const instructor = s.instructor_name?.trim() || 'TBC'
      const price = parseFloat(s.retail_price) > 0 ? `£${parseFloat(s.retail_price).toFixed(0)}` : null
      const level: Level = LEVEL_MAP[s.skill_level_id] ?? guessLevel(className)

      const key = `${dayOfWeek}-${className}-${startTime}`
      if (seenKeys.has(key)) continue
      seenKeys.add(key)

      allClasses.push({
        studioName: STUDIO_NAME,
        studioWebsite: STUDIO_WEBSITE,
        bookingUrl: TIMETABLE_URL,
        className,
        instructor,
        genre: guessGenre(className) as Genre,
        level,
        dayOfWeek,
        startTime,
        endTime,
        location: 'Clifton House, Clifton Terrace, Finsbury Park, London N4 3JP',
        notes: s.class_description?.trim() || null,
        price,
      })
    }
  }

  return allClasses
}
