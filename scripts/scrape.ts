import { runAllScrapers } from '../lib/scrapers'

async function main() {
  console.log('Running all scrapers...')
  const result = await runAllScrapers()
  console.log(`Done. Added/updated ${result.added} classes.`)
  if (result.errors.length > 0) {
    console.error('Errors:')
    result.errors.forEach(e => console.error(`  ${e.studio}: ${e.error}`))
  }
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
