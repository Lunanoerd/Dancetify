/**
 * The Manor LDN scraper
 * Uses date tab navigation (mobile viewport) — each tab shows one day's classes.
 * Clicks through all visible tabs, then scrolls the tab bar right to reveal next week.
 */
import { chromium } from 'playwright'
import type { DanceClass, Genre, Level } from '@/lib/types'
import { guessGenre, guessLevel, normalizeTime } from './utils'

const STUDIO_NAME = 'The Manor LDN'
const STUDIO_WEBSITE = 'https://www.themanorldn.com'
const TIMETABLE_URL = 'https://www.themanorldn.com/timetable'

function parseDayFromTabText(text: string): number {
  // Tab text format: "TUE07.04" or "SAT04.04" — derive dayOfWeek from the actual date
  const match = text.match(/(\d{2})\.(\d{2})/)
  if (!match) return -1
  const day = parseInt(match[1])
  const month = parseInt(match[2]) - 1  // 0-indexed
  const year = new Date().getFullYear()
  return new Date(year, month, day).getDay()  // 0=Sun, 1=Mon, …
}

export async function scrape(): Promise<Omit<DanceClass, 'id' | 'lastScraped'>[]> {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  // Mobile viewport to see tab navigation
  await page.setViewportSize({ width: 390, height: 844 })

  try {
    await page.goto(TIMETABLE_URL, { waitUntil: 'load', timeout: 45000 })
    await page.waitForTimeout(4000)
    await page.waitForSelector('.manor-timetable-box', { timeout: 15000 })

    const allClasses: Omit<DanceClass, 'id' | 'lastScraped'>[] = []
    const seenKeys = new Set<string>()

    // Scrape 2 weeks: scroll tab bar right in 2 passes
    for (let pass = 0; pass < 2; pass++) {
      if (pass === 1) {
        // Scroll tab bar right to reveal next week's tabs
        await page.evaluate(() => {
          const container = Array.from(document.querySelectorAll('*')).find(el => {
            const s = window.getComputedStyle(el)
            return (s.overflowX === 'auto' || s.overflowX === 'scroll') && el.classList.contains('flex')
          }) as HTMLElement | undefined
          if (container) container.scrollLeft += 600
        })
        await page.waitForTimeout(1000)
      }

      // Get all tab elements currently visible/accessible
      const tabs = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('[class*="rounded-lg"][class*="cursor-p"]'))
        return els.map((el, i) => ({ index: i, text: el.textContent?.trim() || '' })).filter(t => /^(MON|TUE|WED|THU|FRI|SAT|SUN)/i.test(t.text))
      })

      for (const tab of tabs) {
        const dayOfWeek = parseDayFromTabText(tab.text)
        if (dayOfWeek === -1) continue

        // Click tab by re-querying (DOM may have changed)
        const tabEls = await page.$$('[class*="rounded-lg"][class*="cursor-p"]')
        if (tabEls[tab.index]) {
          await tabEls[tab.index].click()
          await page.waitForTimeout(2500)
        }

        // Extract classes for this day
        const classes = await page.evaluate(() => {
          const boxes = document.querySelectorAll('.manor-timetable-box')
          return Array.from(boxes).map(box => {
            const paragraphs = box.querySelectorAll('p')
            const className = paragraphs[0]?.textContent?.trim() || ''
            const startTime = paragraphs[1]?.textContent?.trim() || ''
            const instructor = paragraphs[2]?.textContent?.trim() || ''
            const extra = paragraphs[3]?.textContent?.trim() || ''
            const link = box.querySelector('a') as HTMLAnchorElement | null
            return { className, startTime, instructor, extra, bookingUrl: link?.href || '' }
          }).filter(c => c.className)
        })

        for (const c of classes) {
          const key = `${dayOfWeek}-${c.className}-${c.startTime}`
          if (seenKeys.has(key)) continue
          seenKeys.add(key)

          const start = normalizeTime(c.startTime)
          const [h, m] = start.split(':').map(Number)
          const endH = (h + 1) % 24
          const endTime = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`

          allClasses.push({
            studioName: STUDIO_NAME,
            studioWebsite: STUDIO_WEBSITE,
            bookingUrl: c.bookingUrl || TIMETABLE_URL,
            className: c.className,
            instructor: c.instructor || 'TBC',
            genre: guessGenre(c.className + ' ' + c.extra) as Genre,
            level: guessLevel(c.className + ' ' + c.extra) as Level,
            dayOfWeek,
            startTime: start,
            endTime,
            location: 'Clifton House, Clifton Terrace, Finsbury Park, London N4 3JP',
            notes: c.extra || null,
            price: c.extra.match(/£\s*(\d+(?:\.\d+)?)/)?.[0]?.replace(/\s/, '') ?? null,
          })
        }
      }
    }

    await browser.close()
    return allClasses
  } catch (err) {
    await browser.close()
    throw err
  }
}
