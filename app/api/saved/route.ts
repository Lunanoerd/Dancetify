import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { DanceClass } from '@/lib/types'

// GET /api/saved — list the current user's saved classes
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json([], { status: 401 })

  const saved = await db.savedClass.findMany({
    where: { userId },
    orderBy: { savedAt: 'desc' },
  })
  return NextResponse.json(saved)
}

// POST /api/saved — toggle save; body: { cls: DanceClass }
// Returns { saved: boolean }
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Ensure user row exists (Clerk doesn't auto-create it)
  const { cls }: { cls: DanceClass } = await req.json()

  const existing = await db.savedClass.findUnique({
    where: { userId_classId: { userId, classId: cls.id } },
  })

  if (existing) {
    await db.savedClass.delete({ where: { id: existing.id } })
    return NextResponse.json({ saved: false })
  }

  // Make sure the User row exists before creating the relation
  await db.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email: '' },
  })

  await db.savedClass.create({
    data: {
      userId,
      classId: cls.id,
      studioName: cls.studioName,
      className: cls.className,
      instructor: cls.instructor,
      genre: cls.genre,
      startTime: cls.startTime,
      endTime: cls.endTime,
      dayOfWeek: cls.dayOfWeek,
      level: cls.level,
      bookingUrl: cls.bookingUrl,
    },
  })
  return NextResponse.json({ saved: true })
}
