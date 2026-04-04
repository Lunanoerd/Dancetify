import { runAllScrapers } from '@/lib/scrapers'
import { NextRequest } from 'next/server'

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
