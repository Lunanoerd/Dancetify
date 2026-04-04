import { chromium } from 'playwright'

const studios = [
  { name: 'Pineapple', url: 'https://www.pineapple.uk.com/pages/dance-classes-for-adults-at-pineapple-dance-studios' },
  { name: 'Manor', url: 'https://www.themanorldn.com/timetable' },
  { name: 'Base', url: 'https://www.basedancestudios.com/book-your-class' },
  { name: 'Ventures', url: 'https://bookwhen.com/ventures-studio' },
  { name: 'Playground', url: 'https://playgroundlondon.dance/schedule' },
]

async function inspect(name: string, url: string) {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  console.log(`\n${'='.repeat(60)}`)
  console.log(`STUDIO: ${name}  |  ${url}`)
  console.log('='.repeat(60))

  try {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 })
    await page.waitForTimeout(4000)

    const info = await page.evaluate(() => {
      // Check for iframes (some booking widgets load inside iframes)
      const iframes = Array.from(document.querySelectorAll('iframe'))
        .map(f => ({ src: f.src, id: f.id, className: f.className }))

      // Relevant CSS class names (safely handle SVGAnimatedString)
      const relevantClasses = new Set<string>()
      document.querySelectorAll('[class]').forEach(el => {
        const cn = el.getAttribute('class') || ''
        cn.split(/\s+/).forEach(c => {
          if (c && /class|event|session|schedule|booking|time|slot|card|item|tile|course|studio/.test(c)) {
            relevantClasses.add(c)
          }
        })
      })

      // Count candidate elements
      const selectors = [
        'table', 'tr', 'article', 'li',
        '[class*="class"]', '[class*="event"]', '[class*="schedule"]',
        '[class*="session"]', '[class*="booking"]', '[class*="timetable"]',
        '[class*="card"]', '[class*="slot"]', '[class*="tile"]',
      ]
      const counts: Record<string, number> = {}
      for (const sel of selectors) {
        const n = document.querySelectorAll(sel).length
        if (n > 0) counts[sel] = n
      }

      // Find most-repeated child element (likely the class list)
      let bestSample = ''
      let bestCount = 0
      document.querySelectorAll('ul > li, ol > li, div > div, section > div').forEach(el => {
        const siblings = el.parentElement?.children.length ?? 0
        if (siblings > bestCount && siblings < 200 && (el.textContent?.trim().length ?? 0) > 20) {
          bestCount = siblings
          const cn = el.getAttribute('class') || ''
          const parentCn = el.parentElement?.getAttribute('class') || ''
          bestSample = `Parent class="${parentCn.slice(0, 80)}" (${siblings} children)\nChild class="${cn.slice(0, 80)}"\nText: ${el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 250)}`
        }
      })

      return { iframes, relevantClasses: [...relevantClasses].slice(0, 50), counts, bestSample }
    })

    if (info.iframes.length > 0) {
      console.log(`\n⚠️  PAGE HAS ${info.iframes.length} IFRAME(S):`)
      info.iframes.forEach(f => console.log(`   src="${f.src}" id="${f.id}" class="${f.className}"`))
    }

    console.log(`\nRelevant CSS classes: ${info.relevantClasses.join(', ')}`)
    console.log(`\nElement counts:`, JSON.stringify(info.counts, null, 2))
    console.log(`\nBest repeating structure:\n${info.bestSample || '(none found)'}`)

  } catch (err) {
    console.log(`ERROR: ${err instanceof Error ? err.message.slice(0, 200) : err}`)
  }

  await browser.close()
}

async function main() {
  for (const studio of studios) {
    await inspect(studio.name, studio.url)
  }
}

main().catch(console.error)
