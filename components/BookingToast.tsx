'use client'

import { useEffect, useState } from 'react'

export function BookingToast() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3000)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg transition-all"
      style={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', color: '#374151', border: '1.5px solid rgba(255,255,255,0.8)' }}
    >
      Saved to your log ✓
    </div>
  )
}
