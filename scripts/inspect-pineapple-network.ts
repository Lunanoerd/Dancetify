import { chromium } from 'playwright'

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  // Capture all network requests to find the Bookwhen sessions API call
  const requests: string[] = []
  page.on('request', req => {
    const url = req.url()
    if (url.includes('bookwhen') || url.includes('session') || url.includes('class') || url.includes('schedule')) {
      requests.push(`${req.method()} ${url}`)
    }
  })
  page.on('response', async res => {
    const url = res.url()
    if ((url.includes('bookwhen') || url.includes('session')) && res.headers()['content-type']?.includes('json')) {
      try {
        const body = await res.text()
        console.log(`\nJSON RESPONSE from ${url}:`)
        console.log(body.slice(0, 500))
      } catch {}
    }
  })

  await page.goto('https://www.pineapple.uk.com/pages/dance-classes-for-adults-at-pineapple-dance-studios', { waitUntil: 'load', timeout: 45000 })
  await page.waitForTimeout(10000) // wait longer

  console.log('\nAll relevant requests:')
  requests.forEach(r => console.log(' ', r))

  // Also check the bw-widget content now
  const widgetState = await page.evaluate(() => {
    const sessions = document.querySelector('.bw-widget__sessions')
    return {
      html: sessions?.innerHTML?.slice(0, 800) || 'NOT FOUND',
      bwDays: Array.from(document.querySelectorAll('.bw-calendar__day')).map(d => ({
        class: d.getAttribute('class'),
        text: d.textContent?.trim(),
      })),
    }
  })
  console.log('\nWidget state after 10s:')
  console.log('HTML:', widgetState.html.replace(/\s+/g, ' '))
  console.log('Calendar days:', JSON.stringify(widgetState.bwDays.slice(0, 7), null, 2))

  await browser.close()
}

main().catch(console.error)
