/**
 * Deep targeted inspector — now we know what selectors to look for
 */
import { chromium } from 'playwright'

async function inspectPineapple() {
  console.log('\n=== PINEAPPLE (Bookwhen widget) ===')
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto('https://www.pineapple.uk.com/pages/dance-classes-for-adults-at-pineapple-dance-studios', { waitUntil: 'load', timeout: 45000 })
  await page.waitForTimeout(5000)
  // Wait for bookwhen widget
  await page.waitForSelector('.bw-widget__sessions, [class*="bw-widget"]', { timeout: 15000 }).catch(() => null)

  const data = await page.evaluate(() => {
    // Sample a few session elements
    const sessions = document.querySelectorAll('[class*="bw-widget__session"], [class*="bw-widget__event"], .grid-item')
    const results: string[] = []
    sessions.forEach((s, i) => {
      if (i < 5) results.push(`[${i}] class="${s.getAttribute('class')}" text="${s.textContent?.trim().replace(/\s+/g, ' ').slice(0, 200)}"`)
    })

    // Also check inside bw-widget__sessions
    const widget = document.querySelector('.bw-widget__sessions')
    const widgetHTML = widget?.innerHTML?.slice(0, 2000) || 'NOT FOUND'

    // Check day headers
    const days = document.querySelectorAll('[class*="bw-widget__day"], [class*="day-header"]')
    const dayTexts = Array.from(days).map(d => d.textContent?.trim()).slice(0, 7)

    return { sessions: results, widgetHTML, dayTexts, sessionCount: sessions.length }
  })

  console.log(`Sessions found: ${data.sessionCount}`)
  console.log('Day headers:', data.dayTexts)
  console.log('Sample sessions:')
  data.sessions.forEach(s => console.log(' ', s))
  console.log('Widget HTML preview:', data.widgetHTML.replace(/\s+/g, ' ').slice(0, 500))
  await browser.close()
}

async function inspectManor() {
  console.log('\n=== THE MANOR LDN ===')
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto('https://www.themanorldn.com/timetable', { waitUntil: 'load', timeout: 45000 })
  await page.waitForTimeout(4000)
  await page.waitForSelector('.manor-timetable-box', { timeout: 15000 }).catch(() => null)

  const data = await page.evaluate(() => {
    const boxes = document.querySelectorAll('.manor-timetable-box')
    const samples: string[] = []
    boxes.forEach((box, i) => {
      if (i < 5) {
        samples.push(`[${i}] class="${box.getAttribute('class')}" HTML="${box.innerHTML.replace(/\s+/g, ' ').slice(0, 300)}"`)
      }
    })

    // Check for day headers
    const headers = document.querySelectorAll('[class*="day"], [class*="header"], h2, h3')
    const headerTexts = Array.from(headers).map(h => h.textContent?.trim()).filter(Boolean).slice(0, 10)

    // Check items inside boxes
    const items = document.querySelectorAll('.border-b.py-\\[5px\\], [class*="border-b"]')
    const itemSamples = Array.from(items).slice(0, 5).map(el =>
      `class="${el.getAttribute('class')}" text="${el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 150)}"`
    )

    return { boxCount: boxes.length, samples, headerTexts, itemSamples }
  })

  console.log(`Timetable boxes: ${data.boxCount}`)
  console.log('Headers found:', data.headerTexts)
  console.log('Box samples:')
  data.samples.forEach(s => console.log(' ', s))
  console.log('Border-b items:', data.itemSamples)
  await browser.close()
}

async function inspectBase() {
  console.log('\n=== BASE DANCE STUDIOS (Wix iframe) ===')
  const browser = await chromium.launch()
  const page = await browser.newPage()
  // Go directly to the iframe source URL
  await page.goto('https://www-basedancestudios-com.filesusr.com/html/6b178a_26a00ee8297fb4280958b36523e1997e.html', { waitUntil: 'load', timeout: 45000 })
  await page.waitForTimeout(5000)

  const data = await page.evaluate(() => {
    const allText = document.body.textContent?.trim().replace(/\s+/g, ' ').slice(0, 1000)
    const classes = new Set<string>()
    document.querySelectorAll('[class]').forEach(el => {
      const cn = el.getAttribute('class') || ''
      cn.split(/\s+/).forEach(c => { if (c) classes.add(c) })
    })
    const iframes = Array.from(document.querySelectorAll('iframe')).map(f => f.src)
    return { allText, classes: [...classes].slice(0, 60), iframes }
  })

  console.log('Page text:', data.allText)
  console.log('Classes:', data.classes.join(', '))
  console.log('Nested iframes:', data.iframes)
  await browser.close()
}

async function inspectVentures() {
  console.log('\n=== VENTURES STUDIO (Bookwhen) ===')
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto('https://bookwhen.com/ventures-studio', { waitUntil: 'load', timeout: 45000 })
  await page.waitForTimeout(4000)

  const data = await page.evaluate(() => {
    // Inspect table rows
    const rows = document.querySelectorAll('tr')
    const rowSamples = Array.from(rows).slice(0, 8).map(r =>
      `class="${r.getAttribute('class')}" text="${r.textContent?.trim().replace(/\s+/g, ' ').slice(0, 200)}"`
    )

    // Inspect event_title / event_preview elements
    const events = document.querySelectorAll('.event_preview, .event_header, [class*="event_title"]')
    const eventSamples = Array.from(events).slice(0, 5).map(e =>
      `class="${e.getAttribute('class')}" text="${e.textContent?.trim().replace(/\s+/g, ' ').slice(0, 200)}"`
    )

    // time_span
    const times = document.querySelectorAll('.time_span')
    const timeSamples = Array.from(times).slice(0, 5).map(t => t.textContent?.trim())

    // Check for day groupings
    const dayHeaders = document.querySelectorAll('[class*="date"], [class*="day"], th')
    const dayTexts = Array.from(dayHeaders).map(d => d.textContent?.trim()).filter(Boolean).slice(0, 10)

    return { rowSamples, eventSamples, timeSamples, dayTexts }
  })

  console.log('Day/date headers:', data.dayTexts)
  console.log('Table rows:')
  data.rowSamples.forEach(r => console.log(' ', r))
  console.log('Event elements:')
  data.eventSamples.forEach(e => console.log(' ', e))
  console.log('Times:', data.timeSamples)
  await browser.close()
}

async function inspectPlayground() {
  console.log('\n=== PLAYGROUND LONDON (Mindbody iframe) ===')
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto('https://playgroundlondon.dance/schedule', { waitUntil: 'load', timeout: 45000 })
  await page.waitForTimeout(5000)

  // Navigate into the Mindbody iframe
  const frameUrl = 'https://go.mindbodyonline.com/book/widgets/schedules/view/1c4758799ec/schedule'
  const frame = page.frames().find(f => f.url().includes('mindbodyonline.com/book/widgets')) ||
    await page.waitForSelector(`iframe[src*="mindbodyonline"]`, { timeout: 10000 })
      .then(el => el.contentFrame())
      .catch(() => null)

  if (!frame || frame === null) {
    // Try navigating directly to the iframe URL
    console.log('Could not access iframe, navigating directly to Mindbody widget...')
    await page.goto(frameUrl, { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(3000)
  }

  const targetPage = (frame && 'evaluate' in frame) ? frame : page

  const data = await (targetPage as typeof page).evaluate(() => {
    const allText = document.body.textContent?.trim().replace(/\s+/g, ' ').slice(0, 800)
    const classes = new Set<string>()
    document.querySelectorAll('[class]').forEach(el => {
      const cn = el.getAttribute('class') || ''
      cn.split(/\s+/).forEach(c => {
        if (c && /class|event|session|schedule|booking|time|slot|card|item/.test(c)) classes.add(c)
      })
    })
    const iframes = Array.from(document.querySelectorAll('iframe')).map(f => ({ src: f.src, id: f.id }))
    return { allText, classes: [...classes].slice(0, 40), iframes }
  })

  console.log('Text preview:', data.allText)
  console.log('Relevant classes:', data.classes.join(', '))
  console.log('Nested iframes:', data.iframes)
  await browser.close()
}

async function main() {
  await inspectPineapple()
  await inspectManor()
  await inspectBase()
  await inspectVentures()
  await inspectPlayground()
}

main().catch(console.error)
