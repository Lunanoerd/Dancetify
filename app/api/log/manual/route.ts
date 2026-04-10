import { NextRequest } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress ?? ''

  const body = await request.json()
  const { studioName, genre, instructor, classDate, startTime, endTime } = body

  if (!studioName || !genre || !instructor || !classDate) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  await db.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email },
  })

  const manual = await db.manualClass.create({
    data: { userId, studioName, genre, instructor, classDate, startTime, endTime },
  })

  return Response.json({ ok: true, id: manual.id })
}
