import { PrismaClient } from '@/app/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  if (process.env.NODE_ENV === 'production' && tursoUrl && tursoToken) {
    // Production: use Turso hosted database
    const adapter = new PrismaLibSql({ url: tursoUrl, authToken: tursoToken })
    return new PrismaClient({ adapter })
  }

  // Local dev: use local SQLite file
  const dbPath = path.resolve(process.cwd(), 'dev.db')
  const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
  return new PrismaClient({ adapter })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
