import { scrape as scrapeManor } from '../lib/scrapers/manor'
import { scrape as scrapeVentures } from '../lib/scrapers/ventures'
import { scrape as scrapePineapple } from '../lib/scrapers/pineapple'
import { scrape as scrapeBase } from '../lib/scrapers/base'
import { scrape as scrapePlayground } from '../lib/scrapers/playground'

const scrapers = [
  { name: 'The Manor LDN', fn: scrapeManor },
  { name: 'Ventures Studio', fn: scrapeVentures },
  { name: 'Pineapple', fn: scrapePineapple },
  { name: 'Base Dance Studios', fn: scrapeBase },
  { name: 'Playground London', fn: scrapePlayground },
]

async function main() {
  for (const { name, fn } of scrapers) {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`Testing: ${name}`)
    console.log('='.repeat(50))
    try {
      const classes = await fn()
      console.log(`✅ ${classes.length} classes found`)
      classes.slice(0, 3).forEach(c => {
        console.log(`  - [${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][c.dayOfWeek]}] ${c.startTime} "${c.className}" by ${c.instructor} [${c.genre}] [${c.level}]`)
      })
      if (classes.length > 3) console.log(`  ... and ${classes.length - 3} more`)
    } catch (err) {
      console.log(`❌ Error: ${err instanceof Error ? err.message : err}`)
    }
  }
}

main().catch(console.error)
