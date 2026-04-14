/**
 * XY Studio scraper (Bookwhen)
 * Paginates /xystudio/calendar_items (20 rows per page) via Playwright fetch,
 * parses HTML rows, and extracts date from the event ID timestamp.
 */
import { chromium } from 'playwright'
import * as cheerio from 'cheerio'
import type { DanceClass, Genre, Level } from '@/lib/types'
import { guessGenre, guessLevel } from './utils'

const STUDIO_NAME = 'XY Studio'
const STUDIO_WEBSITE = 'https://xystudiolondon.com'
const TIMETABLE_URL = 'https://bookwhen.com/xystudio'
const CALENDAR_ITEMS_URL = 'https://bookwhen.com/xystudio/calendar_items'

// Parse "6pm", "7:30pm", "8:30pm BST" → "18:00"
function parseTime(timeText: string): string {
  const clean = timeText.replace(/\s*(BST|GMT|UTC)\s*/gi, '').trim()
  const match = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i)
  if (!match) return '00:00'
  let h = parseInt(match[1])
  const m = parseInt(match[2] || '0')
  const ampm = match[3].toLowerCase()
  if (ampm === 'pm' && h !== 12) h += 12
  if (ampm === 'am' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Extract date from event ID: "ev-s7l3y-20260407180000" → Date
function dateFromEventId(eventId: string): Date | null {
  const match = eventId.match(/-(\d{8})(\d{6})$/)
  if (!match) return null
  const [, datePart, timePart] = match
  const y = datePart.slice(0, 4)
  const mo = datePart.slice(4, 6)
  const d = datePart.slice(6, 8)
  const h = timePart.slice(0, 2)
  const min = timePart.slice(2, 4)
  return new Date(`${y}-${mo}-${d}T${h}:${min}:00+01:00`)
}

// Parse class name: extract level hint and instructor from summary text
// Summary format: "ClassName with Instructor (Level) @handle"
function parseSummary(text: string): { className: string; instructor: string; levelHint: string } {
  // Remove @handle suffixes
  const clean = text.replace(/@\S+/g, '').trim()
  // Extract level in parentheses at end: "(Beginners)", "(INT/ADV)", "(BEG/INT)"
  const levelMatch = clean.match(/\(([^)]+)\)\s*$/)
  const levelHint = levelMatch?.[1] || ''
  let rest = levelMatch ? clean.slice(0, levelMatch.index).trim() : clean

  // Extract "with Instructor" or "by Instructor" or "covering Instructor"
  const withMatch = rest.match(/\s+(?:with|by)\s+(.+?)(?:\s+covering\s+\S+)?$/i)
  const instructor = withMatch?.[1]?.trim() || 'TBC'
  const className = withMatch ? rest.slice(0, withMatch.index).trim() : rest

  return { className, instructor, levelHint }
}

function parseRows(html: string): Array<{
  eventId: string; date: Date | null; timeText: string; summary: string
}> {
  const $ = cheerio.load(html)
  const results: Array<{ eventId: string; date: Date | null; timeText: string; summary: string }> = []

  $('tr[data-event]').each((_, tr) => {
    const eventId = $(tr).data('event') as string
    const date = dateFromEventId(eventId)
    const timeText = $(tr).find('.time_span').first().text().trim()
    const summary = $(tr).find('.summary button, .summary').first().text().trim()
    if (summary) results.push({ eventId, date, timeText, summary })
  })

  return results
}

export async function scrape(): Promise<Omit<DanceClass, 'id' | 'lastScraped'>[]> {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Load page to get session/cookies
    await page.goto(TIMETABLE_URL, { waitUntil: 'networkidle', timeout: 45000 })
    await page.waitForTimeout(2000)

    // Get initial 20 rows from the page itself
    const initialHTML = await page.content()
    const allRows = parseRows(initialHTML)

    // Paginate to get 2 weeks worth (~14 days, up to ~60 classes for XY)
    // Each page = 20 rows, so 3 pages covers ~60 rows easily
    for (let offset = 20; offset <= 60; offset += 20) {
      const html = await page.evaluate(async ({ url, off }: { url: string; off: number }) => {
        const res = await fetch(`${url}?offset=${off}&limit=20&calendar=v9aat6d42lv8&context=api`, {
          headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': '*/*' }
        })
        return res.text()
      }, { url: CALENDAR_ITEMS_URL, off: offset })

      const rows = parseRows(html)
      if (rows.length === 0) break
      allRows.push(...rows)

      // Stop if we've gone past 2 weeks from now
      const lastDate = rows[rows.length - 1].date
      if (lastDate && lastDate.getTime() > Date.now() + 14 * 24 * 60 * 60 * 1000) break
    }

    await browser.close()

    // Deduplicate by eventId
    const seen = new Set<string>()
    const uniqueRows = allRows.filter(r => {
      if (seen.has(r.eventId)) return false
      seen.add(r.eventId)
      return true
    })

    // Filter to next 2 weeks only
    const cutoff = Date.now() + 14 * 24 * 60 * 60 * 1000

    return uniqueRows
      .filter(r => r.date && r.date.getTime() >= Date.now() - 60 * 60 * 1000 && r.date.getTime() <= cutoff)
      .map(r => {
        const { className, instructor, levelHint } = parseSummary(r.summary)
        const startTime = parseTime(r.timeText)
        const [h, m] = startTime.split(':').map(Number)
        const endH = (h + 1) % 24
        const endTime = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`

        const d = r.date!
        const classDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

        return {
          studioName: STUDIO_NAME,
          studioWebsite: STUDIO_WEBSITE,
          bookingUrl: `https://bookwhen.com/xystudio/e/${r.eventId}`,
          className,
          instructor,
          genre: guessGenre(className) as Genre,
          level: guessLevel(levelHint || className) as Level,
          dayOfWeek: d.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6,
          classDate,
          startTime,
          endTime,
          location: '14 Fulwood Place, London WC1V 6HZ',
          price: null,
          notes: null,
        }
      })
  } catch (err) {
    try { await browser.close() } catch {}
    throw err
  }
}
