import { chromium } from 'playwright'

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto('https://www.pineapple.uk.com/pages/dance-classes-for-adults-at-pineapple-dance-studios', { waitUntil: 'load', timeout: 45000 })
  await page.waitForSelector('.bw-session', { timeout: 20000 })
  await page.waitForTimeout(2000)

  const data = await page.evaluate(() => {
    const session = document.querySelector('.bw-session')
    if (!session) return { html: 'no session found', children: [] }

    // Get all child elements and their classes/text
    const children = Array.from(session.querySelectorAll('*')).map(el => ({
      tag: el.tagName,
      cls: el.getAttribute('class'),
      text: el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 100),
      childCount: el.children.length,
    }))

    return {
      html: session.outerHTML.replace(/\s+/g, ' ').slice(0, 1500),
      children: children.slice(0, 30),
    }
  })

  console.log('Session HTML:')
  console.log(data.html)
  console.log('\nChild elements:')
  data.children.forEach(c => {
    if (c.childCount === 0) console.log(`  <${c.tag} class="${c.cls}">${c.text}</${c.tag}>`)
  })

  await browser.close()
}

main().catch(console.error)
