'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  studioCounts: Record<string, number>
}

export function StudioBar({ studioCounts }: Props) {
  const data = Object.entries(studioCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))

  if (data.length === 0) {
    return <p className="text-sm text-gray-400 py-8 text-center">No data yet</p>
  }

  const COLORS = ['#FFAB91', '#CE93D8', '#80DEEA', '#A5D6A7', '#FFE082', '#F48FB1']

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
        <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={130} />
        <Tooltip
          contentStyle={{ borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.9)', fontSize: 12 }}
          cursor={{ fill: 'rgba(0,0,0,0.05)' }}
        />
        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
