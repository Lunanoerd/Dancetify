/**
 * Base Dance Studios — BSport API
 * Intercepts the BSport /book/v1/offer/ API response during page load.
 * This gives us exact date_start timestamps for every class, avoiding
 * the unreliable pixel-position day detection used previously.
 */
import { chromium } from 'playwright'
import type { DanceClass, Genre, Level } from '@/lib/types'
import { guessGenre, guessLevel } from './utils'

const STUDIO_NAME = 'Base Dance Studios'
const STUDIO_WEBSITE = 'https://www.basedancestudios.com'
const WIDGET_URL = 'https://www-basedancestudios-com.filesusr.com/html/6b178a_26a00ee8297fb4280958b36523e1997e.html'
const BOOKING_URL = 'https://www.basedancestudios.com/book-your-class'

// BSport level ID → our Level type
const LEVEL_ID_MAP: Record<number, Level> = {
  408: 'BEG/INT',   // Beginners
  406: 'BEG/INT',   // Beg/Int
  385: 'BEG/INT',   // Intermediate (beginner-friendly)
  367: 'INT/ADV',   // Int/Adv
  1:   'All levels', // Tous niveaux
  4:   'All levels', // Confirmé
}

function formatTime(isoDate: string): string {
  const d = new Date(isoDate)
  const h = d.getHours()
  const m = d.getMinutes()
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function addMinutes(isoDate: string, minutes: number): string {
  const d = new Date(new Date(isoDate).getTime() + minutes * 60000)
  const h = d.getHours()
  const m = d.getMinutes()
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export async function scrape(): Promise<Omit<DanceClass, 'id' | 'lastScraped'>[]> {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  const captured: {
    offers?: any[]
    coaches?: any[]
    establishments?: any[]
  } = {}

  // Intercept BSport API responses
  page.on('response', async res => {
    const url = res.url()
    try {
      if (url.includes('/book/v1/offer/') && url.includes('min_date') && !url.includes('page_size=1')) {
        const data = JSON.parse(await res.text())
        const offers = Array.isArray(data) ? data : data.results
        // Keep the largest result set (main week fetch, not pagination checks)
        if (!captured.offers || offers.length > captured.offers.length) {
          captured.offers = offers
        }
      }
      if (url.includes('/associated_coach/')) {
        const data = JSON.parse(await res.text())
        captured.coaches = Array.isArray(data) ? data : data.results
      }
      if (url.includes('/book/v1/establishment/') && url.includes('id__in')) {
        const data = JSON.parse(await res.text())
        captured.establishments = Array.isArray(data) ? data : data.results
      }
    } catch {}
  })

  try {
    await page.goto(WIDGET_URL, { waitUntil: 'load', timeout: 45000 })
    await page.waitForTimeout(6000)
    await browser.close()

    if (!captured.offers || captured.offers.length === 0) {
      throw new Error('BSport API returned no offers')
    }

    // Build lookup maps
    const coachMap = new Map<number, string>(
      (captured.coaches || []).map((c: any) => [c.id, c.name || `${c.firstname} ${c.lastname}`.trim()])
    )
    const establishmentMap = new Map<number, string>(
      (captured.establishments || []).map((e: any) => [e.id, e.title])
    )

    return captured.offers
      .filter((offer: any) => !offer.manager_only)
      .map((offer: any) => {
        const dateStart = new Date(offer.date_start)
        const dayOfWeek = dateStart.getDay() // 0=Sun, 1=Mon, …

        // activity_name format: "Instructor Name - Class Type"
        const nameParts = (offer.activity_name as string).split(' - ')
        const className = nameParts.length > 1 ? nameParts.slice(1).join(' - ') : offer.activity_name
        const instructorFromName = nameParts.length > 1 ? nameParts[0] : ''
        const instructor = coachMap.get(offer.coach) || instructorFromName || 'TBC'

        const roomName = establishmentMap.get(offer.establishment) || ''
        const level: Level = LEVEL_ID_MAP[offer.custom_level as number] ?? guessLevel(className) as Level

        return {
          studioName: STUDIO_NAME,
          studioWebsite: STUDIO_WEBSITE,
          bookingUrl: BOOKING_URL,
          className,
          instructor,
          genre: guessGenre(className) as Genre,
          level,
          dayOfWeek,
          startTime: formatTime(offer.date_start),
          endTime: addMinutes(offer.date_start, offer.duration_minute),
          location: roomName
            ? `${roomName}, Base Dance Studios, 4 Tinworth Street, London SE11 5EJ`
            : 'Base Dance Studios, 4 Tinworth Street, London SE11 5EJ',
          price: null,
          notes: null,
        }
      })
  } catch (err) {
    try { await browser.close() } catch {}
    throw err
  }
}
