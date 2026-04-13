/**
 * Ventures Studio (Bookwhen)
 * DOM: tr.clickable rows — first row in a day group has "D Day HH:mmpm [TITLE]",
 * subsequent rows that day have "HH:mmpm [TITLE]"
 */
import { chromium } from 'playwright'
import type { DanceClass, Genre, Level } from '@/lib/types'
import { guessGenre, guessLevel, normalizeTime } from './utils'

const STUDIO_NAME = 'Ventures Studio'
const STUDIO_WEBSITE = 'https://bookwhen.com/ventures-studio'
const TIMETABLE_URL = 'https://bookwhen.com/ventures-studio'

const DAY_NAME_MAP: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
}

export async function scrape(): Promise<Omit<DanceClass, 'id' | 'lastScraped'>[]> {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    await page.goto(TIMETABLE_URL, { waitUntil: 'load', timeout: 45000 })
    await page.waitForTimeout(4000)
    await page.waitForSelector('tr.clickable', { timeout: 15000 })

    const raw = await page.evaluate(() => {
      const results: Array<{
        title: string
        timeRaw: string
        dayName: string
        link: string
      }> = []

      let currentDay = ''

      document.querySelectorAll('tr').forEach(row => {
        const text = row.textContent?.trim().replace(/\s+/g, ' ') || ''
        if (!text) return

        // Detect day header rows (e.g. "3 Fri", "4 Sat")
        const dayHeaderMatch = text.match(/^\d{1,2}\s+(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/i)
        if (dayHeaderMatch) {
          currentDay = dayHeaderMatch[1]
        }

        if (!row.classList.contains('clickable')) return

        // Format: "D Day HH:mmpm BST TITLE" or "HH:mmpm BST TITLE"
        // Strip "In basket" suffix
        const clean = text.replace(/In basket\s*$/i, '').trim()

        // Extract time — looks like "5:30pm BST" or "7pm BST"
        const timeMatch = clean.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s*BST/i)
        const timeRaw = timeMatch?.[1] || ''

        // Title is everything after the time+BST
        const titleStart = clean.indexOf(timeMatch?.[0] || '') + (timeMatch?.[0]?.length || 0)
        const title = clean.slice(titleStart).trim()

        // Bookwhen event URLs: bookwhen.com/ventures-studio#focus={data-event}
        const eventId = row.getAttribute('data-event') || ''
        const link = eventId
          ? `https://bookwhen.com/ventures-studio#focus=${eventId}`
          : 'https://bookwhen.com/ventures-studio'

        if (title && timeRaw) {
          results.push({ title, timeRaw, dayName: currentDay, link })
        }
      })

      return results
    })

    await browser.close()

    return raw.map(r => {
      const dayOfWeek = DAY_NAME_MAP[r.dayName.toLowerCase()] ?? 1
      const startTime = normalizeTime(r.timeRaw)

      // Estimate end time +1.5h
      const [h, m] = startTime.split(':').map(Number)
      const endMins = h * 60 + m + 90
      const endTime = `${String(Math.floor(endMins / 60) % 24).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`

      return {
        studioName: STUDIO_NAME,
        studioWebsite: STUDIO_WEBSITE,
        bookingUrl: r.link,
        className: r.title,
        instructor: extractInstructor(r.title),
        genre: guessGenre(r.title) as Genre,
        level: guessLevel(r.title) as Level,
        dayOfWeek,
        startTime,
        endTime,
        location: '13 Miles Street, London, SW8 1RZ',
        notes: null,
        price: '£12',
      }
    })
  } catch (err) {
    await browser.close()
    throw err
  }
}

/** Ventures titles often look like "INSTRUCTOR CHOREOGRAPHY - ARTIST 'SONG' [LEVEL]" */
function extractInstructor(title: string): string {
  // Try "INSTRUCTOR - ..." or "INSTRUCTOR CHOREOGRAPHY"
  const match = title.match(/^([A-Z][A-Z\s&]+?)(?:\s+CHOREOGRAPHY|\s+-|\s+\[)/i)
  if (match) return toTitleCase(match[1].trim())
  return 'TBC'
}

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}
