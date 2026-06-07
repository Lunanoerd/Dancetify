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

const panel: React.CSSProperties = {
  background: 'var(--panel)',
  border: '1px solid var(--line)',
  borderRadius: '20px',
  padding: '16px',
}

const sectionH: React.CSSProperties = {
  fontWeight: 800,
  fontSize: '10px',
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '.6px',
  marginBottom: '12px',
}

export function DashboardCharts({ weekCounts, genreCounts, studioCounts, wrappedStats, genreColors }: Props) {
  const [showManual, setShowManual] = useState(false)
  const [showWrapped, setShowWrapped] = useState(false)

  return (
    <>
      {/* Weekly chart */}
      <div style={{ ...panel, marginBottom: '12px' }}>
        <h3 style={sectionH}>Classes per week (last 2 weeks)</h3>
        <WeeklyChart weekCounts={weekCounts} />
      </div>

      {/* Genre + studio */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        <div style={panel}>
          <h3 style={sectionH}>By genre</h3>
          <GenreDonut genreCounts={genreCounts} />
        </div>
        <div style={panel}>
          <h3 style={sectionH}>By studio</h3>
          <StudioBar studioCounts={studioCounts} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
        <button
          onClick={() => setShowManual(true)}
          style={{
            border: '1px solid var(--line)',
            background: 'var(--panel2)',
            color: 'var(--ink)',
            fontFamily: 'inherit',
            fontWeight: 800,
            fontSize: '12px',
            padding: '10px 18px',
            borderRadius: '999px',
            cursor: 'pointer',
          }}
        >
          + Add manual class
        </button>

        {wrappedStats.totalHours >= 10 ? (
          <button
            onClick={() => setShowWrapped(true)}
            style={{
              border: 'none',
              background: 'linear-gradient(120deg, var(--accent), #9B6DFF)',
              color: '#fff',
              fontFamily: 'inherit',
              fontWeight: 800,
              fontSize: '12px',
              padding: '10px 18px',
              borderRadius: '999px',
              cursor: 'pointer',
            }}
          >
            Generate my Wrapped ✨
          </button>
        ) : (
          <div
            style={{
              border: '1px solid var(--line)',
              background: 'var(--panel)',
              color: 'var(--muted)',
              fontFamily: 'inherit',
              fontWeight: 700,
              fontSize: '11px',
              padding: '10px 18px',
              borderRadius: '999px',
              cursor: 'not-allowed',
            }}
            title={`You need ${(10 - wrappedStats.totalHours).toFixed(1)} more hours to unlock Wrapped`}
          >
            Wrapped unlocks at 10h — {wrappedStats.totalHours}h so far
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
