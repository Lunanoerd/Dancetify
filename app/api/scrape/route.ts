import { runAllScrapers } from '@/lib/scrapers'
import { NextRequest } from 'next/server'

// Called by Vercel Cron — GET with Authorization header
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const result = await runAllScrapers()
    return Response.json(result)
  } catch (err) {
    return new Response(err instanceof Error ? err.message : 'Scrape failed', { status: 500 })
  }
}

// Manual trigger via POST with x-scrape-secret header
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-scrape-secret')
  if (secret !== process.env.SCRAPE_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const result = await runAllScrapers()
    return Response.json(result)
  } catch (err) {
    return new Response(err instanceof Error ? err.message : 'Scrape failed', { status: 500 })
  }
}
