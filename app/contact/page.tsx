import Link from 'next/link'

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-white/40 px-6 py-5 backdrop-blur-md" style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← Back</Link>
          <h1 className="text-lg font-bold text-gray-800">Contact Us</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div
          className="rounded-2xl p-8 text-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.7)' }}
        >
          <p className="text-2xl mb-4">💌</p>
          <h2 className="text-lg font-bold text-gray-800 mb-3">Get in touch</h2>
          <p className="text-sm text-gray-600 mb-4">
            Please email us at{' '}
            <a href="mailto:hello@dancetify.com" className="font-semibold text-gray-800 underline hover:text-gray-600">
              hello@dancetify.com
            </a>
          </p>
          <p className="text-sm text-gray-400">We will answer your enquiry as soon as we can.</p>
        </div>
      </div>
    </main>
  )
}
