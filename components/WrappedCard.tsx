'use client'

import { useRef } from 'react'
import { toPng } from 'html-to-image'

interface Stats {
  total: number
  topGenre: string
  topStudio: string
  topInstructor: string
  totalHours: number
}

interface Props {
  stats: Stats
  genreColors: Record<string, string>
  onClose: () => void
}

export function WrappedCard({ stats, genreColors, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const genreColor = genreColors[stats.topGenre] ?? '#CE93D8'

  async function handleDownload() {
    if (!cardRef.current) return
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 })
      const a = document.createElement('a')
      a.download = 'dancetify-wrapped.png'
      a.href = dataUrl
      a.click()
    } catch (e) {
      console.error('Failed to generate image', e)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
        {/* The card itself — 9:16 ratio */}
        <div
          ref={cardRef}
          style={{
            width: 320,
            height: 568,
            background: 'linear-gradient(160deg, #fff9c4, #ffccbc, #f8bbd0, #e1bee7)',
            borderRadius: 24,
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: 'sans-serif',
            boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
          }}
        >
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>Dancetify Wrapped</p>
            <p style={{ fontSize: 72, fontWeight: 900, color: '#1f2937', lineHeight: 1, marginBottom: 4 }}>{stats.total}</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#6b7280' }}>classes danced</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <StatRow label="Top genre" value={stats.topGenre} color={genreColor} />
            <StatRow label="Top studio" value={stats.topStudio} />
            <StatRow label="Fave instructor" value={stats.topInstructor} />
            <StatRow label="Hours on the floor" value={`${stats.totalHours}h`} />
          </div>

          <p style={{ fontSize: 13, fontWeight: 700, color: '#d1d5db', letterSpacing: '0.08em', textAlign: 'center' }}>dancetify.com</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className="px-6 py-2.5 rounded-full font-bold text-sm text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#CE93D8' }}
          >
            Download PNG
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full font-semibold text-sm"
            style={{ backgroundColor: 'rgba(255,255,255,0.7)', color: '#374151' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 14, padding: '12px 16px' }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 800, color: color ?? '#1f2937' }}>{value}</p>
    </div>
  )
}
