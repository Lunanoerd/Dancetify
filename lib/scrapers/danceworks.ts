/**
 * Danceworks scraper
 * Uses a Mindbody/BookWhen widget — sessions are date-filtered.
 * Clicks through each day in the 2-week calendar to collect all recurring classes.
 */
import { chromium } from 'playwright'
import type { DanceClass, Genre, Level } from '@/lib/types'
import { guessGenre, guessLevel } from './utils'

const STUDIO_NAME = 'Danceworks'
const STUDIO_WEBSITE = 'https://www.danceworks.com'
const TIMETABLE_URL = 'https://www.danceworks.com/london/classes/timetable/'

interface RawSession {
  dayOfWeek: number
  startTime: string
  endTime: string
  nameText: string   // visible name, e.g. "Classical Ballet - Dmitri Gruzdev - INT - £12"
  levelText: string  // e.g. "Intermediate"
}

function parseName(nameText: string): { className: string; instructor: string; price: string | null } {
  // Format: "ClassName - Instructor Name - LevelCode - £Price"
  const parts = nameText.split(' - ').map(p => p.trim()).filter(Boolean)
  if (parts.length < 2) return { className: nameText, instructor: 'TBC', price: null }

  const priceIdx = parts.findIndex(p => p.startsWith('£'))
  const price = priceIdx >= 0 ? parts[priceIdx] : null

  // Remove level code (short, no spaces, all caps like "INT", "BEG", "ADV/PRO") and price
  const meaningful = parts.filter((p, i) => {
    if (i === priceIdx) return false
    if (/^[A-Z]{2,}[/A-Z0-9]*$/.test(p) && p.length <= 8) return false
    return true
  })

  const className = meaningful[0] || parts[0]
  const instructor = meaningful[1] || 'TBC'

  return { className, instructor, price }
}

export async function scrape(): Promise<Omit<DanceClass, 'id' | 'lastScraped'>[]> {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    await page.goto(TIMETABLE_URL, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(4000)
    await page.waitForSelector('.bw-session', { timeout: 20000 })

    const allClasses: Omit<DanceClass, 'id' | 'lastScraped'>[] = []
    const seenKeys = new Set<string>()

    // Get all date cells across the 2-week calendar
    const dateCells = await page.$$('.bw-calendar__day span[data-bw-startdate]')

    for (const cell of dateCells) {
      await cell.click().catch(() => null)
      await page.waitForTimeout(1500)

      const sessions: RawSession[] = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.bw-session')).map(s => {
          const dayOfWeek = parseInt(s.getAttribute('data-bw-widget-day') ?? '-1')

          const startDatetime = s.querySelector('time.hc_starttime')?.getAttribute('datetime') ?? ''
          const endDatetime = s.querySelector('time.hc_endtime')?.getAttribute('datetime') ?? ''
          const startTime = startDatetime.split('T')[1]?.slice(0, 5) ?? ''
          const endTime = endDatetime.split('T')[1]?.slice(0, 5) ?? ''

          // Get visible name without the hidden genre-prefix span
          const nameEl = s.querySelector('.bw-session__name')
          const typeSpanText = nameEl?.querySelector('.bw-session__type')?.textContent?.trim() ?? ''
          const fullText = nameEl?.textContent?.trim() ?? ''
          const nameText = fullText.startsWith(typeSpanText)
            ? fullText.slice(typeSpanText.length).trim()
            : fullText

          const levelText = s.querySelector('.bw-session__level')?.textContent?.trim() ?? ''

          return { dayOfWeek, startTime, endTime, nameText, levelText }
        }).filter(s => s.dayOfWeek >= 0 && s.startTime)
      })

      for (const s of sessions) {
        const { className, instructor, price } = parseName(s.nameText)
        const key = `${s.dayOfWeek}-${className}-${s.startTime}`
        if (seenKeys.has(key)) continue
        seenKeys.add(key)

        allClasses.push({
          studioName: STUDIO_NAME,
          studioWebsite: STUDIO_WEBSITE,
          bookingUrl: TIMETABLE_URL,
          className,
          instructor,
          genre: guessGenre(className) as Genre,
          level: guessLevel(s.levelText) as Level,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          location: '16 Balderton St, London W1K 6TN',
          notes: null,
          price,
        })
      }
    }

    await browser.close()
    return allClasses
  } catch (err) {
    await browser.close()
    throw err
  }
}
