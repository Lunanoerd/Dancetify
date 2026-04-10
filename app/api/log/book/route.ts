import { NextRequest } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress ?? ''

  const body = await request.json()
  const { classId, studioName, className, instructor, genre, startTime, endTime, classDate } = body

  if (!classId || !classDate) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Upsert user row (lazy creation on first booking)
  await db.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email },
  })

  const booked = await db.bookedClass.create({
    data: { userId, classId, studioName, className, instructor, genre, startTime, endTime, classDate },
  })

  return Response.json({ ok: true, token: booked.emailToken })
}
