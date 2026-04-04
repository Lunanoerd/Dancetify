import { chromium } from 'playwright'

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto('https://go.mindbodyonline.com/book/widgets/schedules/view/1c4758799ec/schedule', { waitUntil: 'load', timeout: 45000 })
  await page.waitForTimeout(5000)
  await page.waitForSelector('[class*="MuiTypography-h6"]', { timeout: 20000 })

  const data = await page.evaluate(() => {
    // Find day sections — look for elements matching "Friday, Apr 3" pattern
    const dateSections: Array<{ tag: string; cls: string; text: string; top: number }> = []
    document.querySelectorAll('*').forEach(el => {
      if (el.children.length > 2) return
      const txt = el.textContent?.trim() || ''
      if (/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+\w+\s+\d+/.test(txt)) {
        const rect = el.getBoundingClientRect()
        dateSections.push({ tag: el.tagName, cls: el.getAttribute('class') || '', text: txt, top: rect.top })
      }
    })

    // Find all MuiGrid-item elements and sample their content
    const gridItems: Array<{ cls: string; text: string; top: number; height: number }> = []
    document.querySelectorAll('[class*="MuiGrid-item"]').forEach(el => {
      const txt = el.textContent?.trim().replace(/\s+/g, ' ') || ''
      if (txt.length > 10) {
        const rect = el.getBoundingClientRect()
        gridItems.push({ cls: el.getAttribute('class') || '', text: txt.slice(0, 150), top: rect.top, height: rect.height })
      }
    })

    // Find elements with time patterns (AM/PM)
    const timeEls: Array<{ tag: string; cls: string; text: string; top: number }> = []
    document.querySelectorAll('h6, p, span, div').forEach(el => {
      const txt = el.textContent?.trim() || ''
      if (/^\d{1,2}:\d{2}\s*(AM|PM)$/.test(txt) && el.children.length === 0) {
        const rect = el.getBoundingClientRect()
        timeEls.push({ tag: el.tagName, cls: el.getAttribute('class') || '', text: txt, top: rect.top })
      }
    })

    return { dateSections: dateSections.slice(0, 5), gridItems: gridItems.slice(0, 10), timeEls: timeEls.slice(0, 8) }
  })

  console.log('Date sections:', JSON.stringify(data.dateSections, null, 2))
  console.log('\nGrid items:', JSON.stringify(data.gridItems, null, 2))
  console.log('\nTime elements:', JSON.stringify(data.timeEls, null, 2))

  await browser.close()
}

main().catch(console.error)
