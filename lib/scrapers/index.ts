import { db } from '@/lib/db'
import type { DanceClass } from '@/lib/types'
import { scrape as scrapePineapple } from './pineapple'
import { scrape as scrapeManor } from './manor'
import { scrape as scrapeBase } from './base'
import { scrape as scrapeVentures } from './ventures'
import { scrape as scrapePlayground } from './playground'

type RawClass = Omit<DanceClass, 'id' | 'lastScraped'>

const scrapers: Array<{ name: string; fn: () => Promise<RawClass[]> }> = [
  { name: 'Pineapple Dance Studios', fn: scrapePineapple },
  { name: 'The Manor LDN', fn: scrapeManor },
  { name: 'Base Dance Studios', fn: scrapeBase },
  { name: 'Ventures Studio', fn: scrapeVentures },
  { name: 'Playground London', fn: scrapePlayground },
]

function makeId(cls: RawClass): string {
  return `${cls.studioName}-${cls.className}-${cls.dayOfWeek}-${cls.startTime}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 191) // Prisma cuid max safe length
}

export async function runAllScrapers(): Promise<{
  added: number
  errors: Array<{ studio: string; error: string }>
}> {
  const errors: Array<{ studio: string; error: string }> = []
  let added = 0

  for (const { name, fn } of scrapers) {
    try {
      console.log(`Scraping ${name}…`)
      const classes = await fn()
      console.log(`  → ${classes.length} classes found`)

      for (const cls of classes) {
        const id = makeId(cls)
        await db.danceClass.upsert({
          where: { id },
          update: { ...cls, lastScraped: new Date() },
          create: { id, ...cls, lastScraped: new Date() },
        })
        added++
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`  Error scraping ${name}: ${message}`)
      errors.push({ studio: name, error: message })
    }
  }

  return { added, errors }
}
