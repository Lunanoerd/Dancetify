'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  weekCounts: Record<string, number>
}

export function WeeklyChart({ weekCounts }: Props) {
  const data = Object.entries(weekCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week: week.replace(/^\d{4}-/, ''), count }))

  if (data.length === 0) {
    return <p className="text-sm text-gray-400 py-8 text-center">No data yet</p>
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', fontSize: 12 }}
          cursor={{ fill: 'rgba(0,0,0,0.05)' }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill="#CE93D8" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
