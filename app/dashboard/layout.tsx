import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/40 px-6 py-4 backdrop-blur-md" style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← Timetable</Link>
            <h1 className="text-lg font-bold text-gray-800">My Progress</h1>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
