/**
 * Pineapple Dance Studios scraper
 * Uses Mindbody's "branded web" widget (bw-session elements).
 * Widget loads asynchronously — needs ~10s to render.
 *
 * Key DOM:
 *   .bw-widget__day → one per day, contains .bw-widget__date (human date) + .bw-session elements
 *   .bw-session      → data-bw-widget-day="5" (0=Sun…6=Sat), data-bw-widget-mbo-class-name
 *   hc_starttime / hc_endtime → <time datetime="2026-04-03T16:25">
 *
 * Booking URLs: constructed from Mindbody studioid (479928) + data-bw-widget-mbo-class-id per session.
 * Sessions use JS-modal booking (no <a> href), so we build the direct Mindbody classic booking URL.
 */
import { chromium } from 'playwright'
import type { DanceClass, Genre, Level } from '@/lib/types'
import { guessGenre, guessLevel } from './utils'

const STUDIO_NAME = 'Pineapple Dance Studios'
const STUDIO_WEBSITE = 'https://www.pineapple.uk.com'
const TIMETABLE_URL = 'https://www.pineapple.uk.com/pages/dance-classes-for-adults-at-pineapple-dance-studios'
const MB_STUDIO_ID = '479928'

function makeBookingUrl(mboClassId: string): string {
  if (!mboClassId) return TIMETABLE_URL
  return `https://clients.mindbodyonline.com/classic/ws?studioid=${MB_STUDIO_ID}&stype=-7&classId=${mboClassId}`
}

export async function scrape(): Promise<Omit<DanceClass, 'id' | 'lastScraped'>[]> {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    await page.goto(TIMETABLE_URL, { waitUntil: 'load', timeout: 45000 })
    // Wait for widget to initialise (any bw-session including empty ones)
    await page.waitForSelector('.bw-session', { timeout: 20000 }).catch(() => null)
    await page.waitForTimeout(2000)

    // Click each non-past calendar day to load all sessions across the week
    const calendarDays = await page.$$('.bw-calendar__day:not(.bw-calendar__day--past)')
    for (const dayEl of calendarDays) {
      await dayEl.click()
      await page.waitForTimeout(1500)
    }

    const sessions = await page.evaluate(() => {
      const results: Array<{
        className: string
        instructor: string
        dayOfWeek: number
        startTime: string
        endTime: string
        mboClassId: string
        level: string
        location: string
        price: string | null
      }> = []

      document.querySelectorAll('.bw-session').forEach(session => {
        // Day of week from data attribute (Mindbody: 0=Sun, 1=Mon…)
        const dayAttr = session.getAttribute('data-bw-widget-day')
        const dayOfWeek = dayAttr !== null ? parseInt(dayAttr) : 1

        // Times from <time> elements
        const startEl = session.querySelector('.hc_starttime') as HTMLTimeElement | null
        const endEl = session.querySelector('.hc_endtime') as HTMLTimeElement | null
        const startDt = startEl?.getAttribute('datetime') || ''
        const endDt = endEl?.getAttribute('datetime') || ''

        // Parse HH:MM from datetime="2026-04-03T16:25"
        const startTime = startDt.includes('T') ? startDt.split('T')[1].slice(0, 5) : startEl?.textContent?.trim() || '00:00'
        const endTime = endDt.includes('T') ? endDt.split('T')[1].slice(0, 5) : endEl?.textContent?.trim() || '00:00'

        // Pineapple embeds price (£XX) and instructor name at end of .bw-session__name text
        // Format: "Commercial Hip Hop (Int) £12 Polly Towers"
        // Genre prefix is in a hidden .bw-session__type span inside the name element
        const nameEl = session.querySelector('.bw-session__name')
        const typeSpan = nameEl?.querySelector('.bw-session__type')
        const genrePrefix = typeSpan?.textContent?.trim().replace(/-\s*$/, '').trim() || ''

        // Get raw text excluding the hidden span
        const nameRaw = nameEl?.textContent?.trim().replace(/\s+/g, ' ') || ''
        // Strip hidden span text from front (it appears in textContent even if display:none)
        const nameWithoutPrefix = (nameRaw.startsWith(genrePrefix)
          ? nameRaw.slice(genrePrefix.length).trim()
          : nameRaw).replace(/^[-\s]+/, '').trim()

        // Parse: "Commercial Hip Hop (Int) £12 Polly Towers"
        const priceMatch = nameWithoutPrefix.match(/£(\d+)\s*(.*)$/)
        const className = priceMatch ? nameWithoutPrefix.slice(0, nameWithoutPrefix.indexOf('£')).trim() : nameWithoutPrefix
        const instructorFromName = priceMatch ? priceMatch[2].trim() : ''

        const rawName = className

        // Instructor from staff element, fall back to the name-embedded instructor
        const staffEl = session.querySelector('.bw-session__staff')
        const staffText = staffEl?.textContent?.trim().replace(/\s+/g, ' ') || ''
        const isSubstitute = staffText.toLowerCase().includes('substitute')
        const instructor = isSubstitute ? instructorFromName : (staffText || instructorFromName)

        // Mindbody class ID for direct booking URL construction
        const mboClassId = session.getAttribute('data-bw-widget-mbo-class-id') || ''

        // Location / room
        const locationEl = session.querySelector('.bw-session__location, .hc_location')
        const locationText = locationEl?.textContent?.trim() || ''
        // Replace generic "In Studio Classes" with actual address
        const location = (!locationText || locationText === 'In Studio Classes')
          ? '7 Langley St, Covent Garden, London WC2H 9JA'
          : locationText

        // Level indicator
        const levelAttr = session.getAttribute('data-bw-widget-class-level') || ''
        const level = levelAttr

        const price = priceMatch ? `£${priceMatch[1]}` : null
        if (rawName) {
          results.push({ className: rawName, instructor, dayOfWeek, startTime, endTime, mboClassId, level, location, price })
        }
      })

      return results
    })

    await browser.close()

    return sessions.map(s => ({
      studioName: STUDIO_NAME,
      studioWebsite: STUDIO_WEBSITE,
      bookingUrl: makeBookingUrl(s.mboClassId),
      className: toTitleCase(s.className),
      instructor: s.instructor || 'TBC',
      genre: guessGenre(s.className) as Genre,
      level: guessLevel(s.className) as Level,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      location: s.location,
      price: s.price,
      notes: null,
    }))
  } catch (err) {
    await browser.close()
    throw err
  }
}

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}
