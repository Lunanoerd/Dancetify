import { db } from '@/lib/db'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const genre = searchParams.get('genre')
  const day = searchParams.get('day')
  const studio = searchParams.get('studio')
  const level = searchParams.get('level')

  const where: Record<string, unknown> = {}
  if (genre) where.genre = genre
  if (day !== null) where.dayOfWeek = parseInt(day)
  if (studio) where.studioName = studio
  if (level) where.level = level

  const classes = await db.danceClass.findMany({
    where,
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })

  return Response.json(classes)
}
