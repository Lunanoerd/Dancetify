import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { sendAttendanceEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const now = new Date()

  // Fetch all pending classes that haven't had an email sent yet
  const candidates = await db.bookedClass.findMany({
    where: { emailSent: false, attended: 'pending' },
    include: { user: true },
  })

  // Only send if class start time + 1 hour has passed
  const pending = candidates.filter(booked => {
    const [h, m] = booked.startTime.split(':').map(Number)
    const classStart = new Date(`${booked.classDate}T${String(h).padStart(2, '0')}:${String(m ?? 0).padStart(2, '0')}:00`)
    const sendAfter = new Date(classStart.getTime() + 1 * 60 * 60 * 1000)
    return now >= sendAfter
  })

  let sent = 0
  const errors: string[] = []

  for (const booked of pending) {
    try {
      await sendAttendanceEmail(booked.user.email, booked)
      await db.bookedClass.update({
        where: { id: booked.id },
        data: { emailSent: true },
      })
      sent++
    } catch (err) {
      errors.push(`${booked.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return Response.json({ sent, errors })
}
