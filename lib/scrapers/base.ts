/**
 * Base Dance Studios (BSport widget inside Wix iframe)
 * We navigate directly to the iframe URL and scrape BSport's weekly calendar.
 * Key classes: bs-card-offer, bs-card-offer__content__title,
 *              bs-card-offer__content__time, bs-card-offer__content__coach,
 *              bs-week__header__date__weekDay, bs-week__header__date__monthDay
 */
import { chromium } from 'playwright'
import type { DanceClass, Genre, Level } from '@/lib/types'
import { guessGenre, guessLevel, normalizeTime } from './utils'

const STUDIO_NAME = 'Base Dance Studios'
const STUDIO_WEBSITE = 'https://www.basedancestudios.com'
// Go directly to the iframe source — avoids Wix wrapper delays
const WIDGET_URL = 'https://www-basedancestudios-com.filesusr.com/html/6b178a_26a00ee8297fb4280958b36523e1997e.html'
const BOOKING_URL = 'https://www.basedancestudios.com/book-your-class'

const DAY_NAME_MAP: Record<string, number> = {
  sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tuesday: 2,
  wed: 3, wednesday: 3, thu: 4, thursday: 4, fri: 5, friday: 5,
  sat: 6, saturday: 6,
}

export async function scrape(): Promise<Omit<DanceClass, 'id' | 'lastScraped'>[]> {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    await page.goto(WIDGET_URL, { waitUntil: 'load', timeout: 45000 })
    await page.waitForTimeout(5000)
    await page.waitForSelector('.bs-card-offer', { timeout: 20000 })

    const data = await page.evaluate(() => {
      // Get day headers — BSport shows them as column headers
      // Each column header has weekDay name and monthDay number
      const dayHeaders = Array.from(document.querySelectorAll('.bs-week__header__date__weekDay'))
        .map((el, idx) => ({
          idx,
          name: el.textContent?.trim() || '',
        }))

      // Get column positions for each day header
      const headerPositions = Array.from(document.querySelectorAll('.bs-week__header__date'))
        .map((el, idx) => {
          const rect = el.getBoundingClientRect()
          const weekDay = el.querySelector('.bs-week__header__date__weekDay')?.textContent?.trim() || ''
          return { idx, weekDay, left: rect.left }
        })

      // Get all class cards
      const cards = Array.from(document.querySelectorAll('.bs-card-offer'))
      const results: Array<{
        title: string
        startTime: string
        endTime: string
        instructor: string
        level: string
        status: string
        studioRoom: string
        cardLeft: number
        bookingUrl: string
      }> = []

      cards.forEach(card => {
        const title = card.querySelector('.bs-card-offer__content__title')?.textContent?.trim() || ''
        if (!title || title.length < 3) return

        const timeEl = card.querySelector('.bs-card-offer__content__time')
        const startEl = card.querySelector('.bs-card-offer__content__time__offer-hours__start-time')
        const endEl = card.querySelector('.bs-card-offer__content__time__offer-hours__end-time-duration')
        const instructorEl = card.querySelector('.bs-card-offer__content__coach')
        const levelEl = card.querySelector('.bs-level-content')
        const statusEl = card.querySelector('.bs-card-offer__content__status')
        // BSport shows the studio room name in a specific element
        const studioRoomEl = card.querySelector('[class*="studio"], [class*="location"], [class*="establishment"]')
        // Also look for it in the card text — format is often "Room Name\nStatus"
        const cardText = card.textContent?.trim() || ''
        const roomMatch = cardText.match(/(Jackson Studio|Timberlake Studio|Astaire Studio|Bernstein Studio|[\w]+ Studio)/i)
        const studioRoom = studioRoomEl?.textContent?.trim() || roomMatch?.[1] || ''

        const timeText = timeEl?.textContent?.trim() || ''
        const timeParts = timeText.match(/(\d{1,2}:\d{2}\s*[AP]M)/gi) || []

        const rect = card.getBoundingClientRect()
        const bookLink = card.querySelector('a') as HTMLAnchorElement | null

        results.push({
          title,
          startTime: startEl?.textContent?.trim() || timeParts[0] || '',
          endTime: endEl?.textContent?.trim() || timeParts[1] || '',
          instructor: instructorEl?.textContent?.trim() || '',
          level: levelEl?.textContent?.trim() || '',
          status: statusEl?.textContent?.trim() || '',
          studioRoom,
          cardLeft: rect.left,
          bookingUrl: bookLink?.href || '',
        })
      })

      return { dayHeaders, headerPositions, results }
    })

    // Match each card to a day column by horizontal position
    function getDayForCard(cardLeft: number): number {
      if (data.headerPositions.length === 0) return 1
      // Find the closest header to the left of the card
      const sorted = [...data.headerPositions].sort((a, b) => b.left - a.left)
      const match = sorted.find(h => h.left <= cardLeft + 20)
      const dayName = match?.weekDay.toLowerCase() || ''
      return DAY_NAME_MAP[dayName] ?? 1
    }

    await browser.close()

    return data.results
      .filter(r => r.title && !/closed|cancelled/i.test(r.status))
      .map(r => ({
        studioName: STUDIO_NAME,
        studioWebsite: STUDIO_WEBSITE,
        bookingUrl: r.bookingUrl || BOOKING_URL,
        className: r.title,
        instructor: r.instructor || 'TBC',
        genre: guessGenre(r.title) as Genre,
        level: guessLevel(r.level || r.title) as Level,
        dayOfWeek: getDayForCard(r.cardLeft),
        startTime: normalizeTime(r.startTime),
        endTime: normalizeTime(r.endTime),
        location: r.studioRoom
          ? `${r.studioRoom}, Base Dance Studios, London W1T`
          : 'Base Dance Studios, London W1T',
        price: null,
        notes: null,
      }))
  } catch (err) {
    await browser.close()
    throw err
  }
}
