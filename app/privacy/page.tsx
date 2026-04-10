import Link from 'next/link'
import { privacyHtml, privacyCss } from '@/lib/privacy-content'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-white/40 px-6 py-5 backdrop-blur-md" style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}>
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← Back</Link>
          <h1 className="text-lg font-bold text-gray-800">Privacy Policy</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div
          className="rounded-2xl p-8"
          style={{ backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.7)' }}
        >
          <style dangerouslySetInnerHTML={{ __html: privacyCss }} />
          <div dangerouslySetInnerHTML={{ __html: privacyHtml }} />
        </div>
      </div>
    </main>
  )
}
