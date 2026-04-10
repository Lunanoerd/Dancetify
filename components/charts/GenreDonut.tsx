'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { GENRE_COLORS } from '@/lib/types'

interface Props {
  genreCounts: Record<string, number>
}

export function GenreDonut({ genreCounts }: Props) {
  const data = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  if (data.length === 0) {
    return <p className="text-sm text-gray-400 py-8 text-center">No data yet</p>
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
          {data.map((entry, i) => (
            <Cell key={i} fill={(GENRE_COLORS as Record<string, string>)[entry.name] ?? '#B0BEC5'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.9)', fontSize: 12 }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
