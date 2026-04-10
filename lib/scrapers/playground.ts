/**
 * Playground London (Mindbody widget)
 * Each class row is a MuiGrid-container with 5 children.
 * Row text format: "2:00 PM 90 min CHOREOGRAPHY (INT/ADV) Daley Monte • Main Studio Show Details..."
 *
 * Booking URLs: The Mindbody Go widget uses JS-modal booking with no extractable per-class href.
 * Falls back to the Playground schedule page. Skipped for deep-link fix (same constraint as Manor).
 */
import { chromium, type Page } from 'playwright'
import type { DanceClass, Genre, Level } from '@/lib/types'
import { guessGenre, guessLevel, normalizeTime } from './utils'

const STUDIO_NAME = 'Playground London'
const STUDIO_WEBSITE = 'https://playgroundlondon.dance'
const WIDGET_URL = 'https://go.mindbodyonline.com/book/widgets/schedules/view/1c4758799ec/schedule'
const BOOKING_URL = 'https://playgroundlondon.dance/schedule'

const DAY_NAME_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
}

export async function scrape(): Promise<Omit<DanceClass, 'id' | 'lastScraped'>[]> {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const allClasses: Omit<DanceClass, 'id' | 'lastScraped'>[] = []

  try {
    await page.goto(WIDGET_URL, { waitUntil: 'load', timeout: 45000 })
    await page.waitForTimeout(8000)

    // Jump to next available class if today has none
    const hasNext = await page.locator('text=/Go to/i').isVisible().catch(() => false)
    if (hasNext) {
      await page.locator('text=/Go to/i').click()
      await page.waitForTimeout(4000)
    }

    // Scrape across 7 days by clicking day tabs
    for (let i = 0; i < 7; i++) {
      const classes = await extractDayClasses(page)
      allClasses.push(...classes)

      const moved = await clickNextDayTab(page)
      if (!moved) break
      await page.waitForTimeout(2500)
    }

    await browser.close()

    const seen = new Set<string>()
    return allClasses.filter(c => {
      const key = `${c.className}-${c.dayOfWeek}-${c.startTime}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  } catch (err) {
    await browser.close()
    throw err
  }
}

async function extractDayClasses(page: Page): Promise<Omit<DanceClass, 'id' | 'lastScraped'>[]> {
  const raw = await page.evaluate(() => {
    const dayText = document.querySelector('h1')?.textContent?.trim() || ''

    // Each class is a MuiGrid-container with 5 children that contains a time pattern and "•"
    const rows = Array.from(document.querySelectorAll('[class*="MuiGrid-container"]')).filter(el => {
      const txt = el.textContent || ''
      return /\d:\d{2}\s*(AM|PM)/i.test(txt) && txt.includes('•')
    })

    return rows.map(row => {
      const text = row.textContent?.trim().replace(/\s+/g, ' ') || ''
      const link = (row.querySelector('a') as HTMLAnchorElement | null)?.href || ''
      return { text, link, dayText }
    })
  })

  return raw.map(r => {
    const timeMatch = r.text.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i)
    const durMatch = r.text.match(/(\d+)\s*min/i)
    const startTimeRaw = timeMatch?.[1] || ''
    const duration = parseInt(durMatch?.[1] || '90')

    // Everything after "XX min" and before "Show Details"
    const afterDur = r.text.replace(/.*\d+\s*min\s*/i, '').replace(/Show Details.*/i, '').trim()
    // Split on "•" — left is className+instructor, right is studio
    const bulletIdx = afterDur.indexOf('•')
    const beforeBullet = bulletIdx > 0 ? afterDur.slice(0, bulletIdx).trim() : afterDur

    // Playground format: "CHOREOGRAPHY (INT/ADV)Daley Monte" — no space between class type and name
    // Split on last run of Title-Case words (instructor name) from Title-Case boundary
    const nameInstructorMatch = beforeBullet.match(/^(.*?\))\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)$/)
    const className = nameInstructorMatch ? nameInstructorMatch[1].trim() : beforeBullet
    const instructor = nameInstructorMatch ? nameInstructorMatch[2].trim() : 'TBC'

    const dayMatch = r.dayText.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i)
    const dayOfWeek = DAY_NAME_MAP[dayMatch?.[1].toLowerCase() || ''] ?? 1
    const startTime = normalizeTime(startTimeRaw)
    const [h, m] = startTime.split(':').map(Number)
    const endMins = h * 60 + m + duration
    const endTime = `${String(Math.floor(endMins / 60) % 24).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`

    return {
      studioName: STUDIO_NAME,
      studioWebsite: STUDIO_WEBSITE,
      bookingUrl: r.link || BOOKING_URL,
      className,
      instructor,
      genre: guessGenre(className) as Genre,
      level: guessLevel(className) as Level,
      dayOfWeek,
      startTime,
      endTime,
      location: '8 Manningtree Street, London E1 1LG',
      price: '£14',
      notes: null,
    }
  })
}

async function clickNextDayTab(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    // Day tabs: elements with text like "Sat4", "Sun5", "Mon6" etc.
    const tabs = Array.from(document.querySelectorAll('[class*="MuiStack-root"], [class*="MuiButtonBase"]')).filter(el => {
      return /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\d+$/.test(el.textContent?.trim() || '') && el.children.length <= 2
    })
    if (tabs.length < 2) return false

    // Get current day number from H1 like "Monday, Apr 6"
    const h1Text = document.querySelector('h1')?.textContent?.trim() || ''
    const currentDayNum = parseInt(h1Text.match(/\d+$/)?.[0] || '0')

    // Click the first tab whose number is greater than current
    for (const tab of tabs) {
      const tabNum = parseInt(tab.textContent?.replace(/\D/g, '') || '0')
      if (tabNum > currentDayNum) {
        ;(tab as HTMLElement).click()
        return true
      }
    }
    return false
  })
}
