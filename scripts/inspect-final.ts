import { chromium } from 'playwright'

async function inspectManorDays() {
  console.log('\n=== MANOR — Day structure ===')
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto('https://www.themanorldn.com/timetable', { waitUntil: 'load', timeout: 45000 })
  await page.waitForTimeout(4000)
  await page.waitForSelector('.manor-timetable-box', { timeout: 15000 }).catch(() => null)

  const data = await page.evaluate(() => {
    // Walk the DOM to understand how timetable boxes are grouped by day
    const boxes = document.querySelectorAll('.manor-timetable-box')
    const results: string[] = []
    boxes.forEach((box, i) => {
      if (i >= 10) return
      // Walk up to find day header
      let el: Element | null = box
      let dayText = ''
      while (el && !dayText) {
        el = el.parentElement
        if (!el) break
        // Check if this parent or a sibling contains a day name
        const prev = el.previousElementSibling
        if (prev) {
          const txt = prev.textContent?.trim() || ''
          if (/monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun/i.test(txt)) {
            dayText = txt
          }
        }
        // Also check for data attributes
        const da = el.getAttribute('data-day') || el.getAttribute('data-date') || ''
        if (da) dayText = da
      }

      // Get the full outer HTML of the box parent to understand structure
      const parent = box.parentElement
      const parentHTML = parent?.outerHTML?.replace(/\s+/g, ' ').slice(0, 400) || ''

      const className = box.querySelector('.font-secondary')?.textContent?.trim() || ''
      const time = box.querySelector('.font-medium')?.textContent?.trim() || ''
      const instructor = box.querySelectorAll('p')[2]?.textContent?.trim() || ''

      results.push(`CLASS="${className}" TIME="${time}" INSTRUCTOR="${instructor}" DAY_FOUND="${dayText}" PARENT="${parentHTML.slice(0, 200)}"`)
    })

    // Also look for day labels in the full page
    const possibleDayEls = Array.from(document.querySelectorAll('*')).filter(el => {
      const t = el.textContent?.trim() || ''
      return /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i.test(t) && el.children.length === 0
    })
    const dayLabels = possibleDayEls.map(el => ({
      tag: el.tagName,
      class: el.getAttribute('class'),
      text: el.textContent?.trim(),
    }))

    return { results, dayLabels }
  })

  data.results.forEach(r => console.log(r))
  console.log('Day label elements:', JSON.stringify(data.dayLabels, null, 2))
  await browser.close()
}

async function inspectPlaygroundMindbody() {
  console.log('\n=== PLAYGROUND — Mindbody widget details ===')
  const browser = await chromium.launch()
  const page = await browser.newPage()
  // Go directly to the Mindbody schedule widget
  await page.goto('https://go.mindbodyonline.com/book/widgets/schedules/view/1c4758799ec/schedule', { waitUntil: 'load', timeout: 45000 })
  await page.waitForTimeout(5000)

  const data = await page.evaluate(() => {
    // Find class items in the schedule
    const gridItems = document.querySelectorAll('[class*="MuiGrid-item"], [class*="session"], [class*="class-item"]')
    const samples: string[] = []
    gridItems.forEach((item, i) => {
      if (i < 10 && (item.textContent?.trim().length ?? 0) > 20) {
        samples.push(`[${i}] class="${item.getAttribute('class')}" text="${item.textContent?.trim().replace(/\s+/g, ' ').slice(0, 200)}"`)
      }
    })

    // Look for day column headers
    const dayEls = Array.from(document.querySelectorAll('*')).filter(el => {
      const t = el.textContent?.trim() || ''
      return /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun|\d{1,2}$)/.test(t) && el.children.length <= 2
    }).slice(0, 15).map(el => `<${el.tagName} class="${el.getAttribute('class')}">${el.textContent?.trim()}</${el.tagName}>`)

    // Find class rows - look for time patterns like "6:00 PM"
    const withTimes = Array.from(document.querySelectorAll('*')).filter(el => {
      return /\d{1,2}:\d{2}\s*(AM|PM)/i.test(el.textContent?.trim() || '') && el.children.length < 5
    }).slice(0, 8).map(el => `<${el.tagName} class="${el.getAttribute('class')}">${el.textContent?.trim().slice(0, 150)}</${el.tagName}>`)

    return { samples, dayEls, withTimes }
  })

  console.log('Grid items:')
  data.samples.forEach(s => console.log(' ', s))
  console.log('\nDay headers:')
  data.dayEls.forEach(d => console.log(' ', d))
  console.log('\nElements with time patterns:')
  data.withTimes.forEach(t => console.log(' ', t))
  await browser.close()
}

async function inspectPineappleWait() {
  console.log('\n=== PINEAPPLE — Wait longer for Bookwhen widget ===')
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto('https://www.pineapple.uk.com/pages/dance-classes-for-adults-at-pineapple-dance-studios', { waitUntil: 'load', timeout: 45000 })
  await page.waitForTimeout(8000) // wait more

  const data = await page.evaluate(() => {
    const widget = document.querySelector('.bw-widget__sessions')
    const widgetHTML = widget?.innerHTML?.replace(/\s+/g, ' ').slice(0, 1000) || 'NOT FOUND'

    // Check all bw-* classes
    const bwClasses = new Set<string>()
    document.querySelectorAll('[class]').forEach(el => {
      const cn = el.getAttribute('class') || ''
      cn.split(/\s+/).forEach(c => { if (c.startsWith('bw-')) bwClasses.add(c) })
    })

    // Count class type / level elements (Bookwhen filter)
    const classTypes = document.querySelectorAll('.class_type')
    const classLevels = document.querySelectorAll('.class_level')
    const sessions = document.querySelectorAll('.bw-widget__session, [class*="bw-widget__session"]')

    const sessionSamples = Array.from(sessions).slice(0, 3).map(s => ({
      class: s.getAttribute('class'),
      text: s.textContent?.trim().replace(/\s+/g, ' ').slice(0, 200),
    }))

    return {
      widgetHTML,
      bwClasses: [...bwClasses],
      classTypeCount: classTypes.length,
      classLevelCount: classLevels.length,
      sessionCount: sessions.length,
      sessionSamples,
    }
  })

  console.log('BW classes:', data.bwClasses.join(', '))
  console.log('class_type elements:', data.classTypeCount)
  console.log('class_level elements:', data.classLevelCount)
  console.log('bw-widget__session count:', data.sessionCount)
  console.log('Sessions:', JSON.stringify(data.sessionSamples, null, 2))
  console.log('Widget HTML:', data.widgetHTML)
  await browser.close()
}

async function main() {
  await inspectManorDays()
  await inspectPlaygroundMindbody()
  await inspectPineappleWait()
}

main().catch(console.error)
