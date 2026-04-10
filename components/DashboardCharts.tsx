'use client'

import { useState } from 'react'
import { WeeklyChart } from './charts/WeeklyChart'
import { GenreDonut } from './charts/GenreDonut'
import { StudioBar } from './charts/StudioBar'
import { ManualClassModal } from './ManualClassModal'
import { WrappedCard } from './WrappedCard'

interface Props {
  weekCounts: Record<string, number>
  genreCounts: Record<string, number>
  studioCounts: Record<string, number>
  wrappedStats: { total: number; topGenre: string; topStudio: string; topInstructor: string; totalHours: number }
  genreColors: Record<string, string>
}

export function DashboardCharts({ weekCounts, genreCounts, studioCounts, wrappedStats, genreColors }: Props) {
  const [showManual, setShowManual] = useState(false)
  const [showWrapped, setShowWrapped] = useState(false)

  return (
    <>
      {/* Weekly chart */}
      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.7)' }}
      >
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Classes per week (last 2 weeks)</h2>
        <WeeklyChart weekCounts={weekCounts} />
      </div>

      {/* Genre + studio charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.7)' }}
        >
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">By genre</h2>
          <GenreDonut genreCounts={genreCounts} />
        </div>
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.7)' }}
        >
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">By studio</h2>
          <StudioBar studioCounts={studioCounts} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setShowManual(true)}
          className="px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
          style={{ backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.7)', color: '#374151' }}
        >
          + Add manual class
        </button>
        {wrappedStats.totalHours >= 10 ? (
          <button
            onClick={() => setShowWrapped(true)}
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#CE93D8' }}
          >
            Generate my Wrapped ✨
          </button>
        ) : (
          <div
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-gray-400 cursor-not-allowed"
            style={{ backgroundColor: 'rgba(255,255,255,0.4)', border: '1.5px solid rgba(255,255,255,0.6)' }}
            title={`You need ${(8 - wrappedStats.totalHours).toFixed(1)} more hours of dancing to unlock Wrapped`}
          >
            Wrapped unlocks at 10h danced — {wrappedStats.totalHours}h so far
          </div>
        )}
      </div>

      {showManual && (
        <ManualClassModal
          onClose={() => setShowManual(false)}
          onSaved={() => { setShowManual(false); window.location.reload() }}
        />
      )}

      {showWrapped && (
        <WrappedCard
          stats={wrappedStats}
          genreColors={genreColors}
          onClose={() => setShowWrapped(false)}
        />
      )}
    </>
  )
}
