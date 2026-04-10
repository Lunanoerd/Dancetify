interface Props {
  label: string
  value: string | number
  sub?: string
}

export function StatsCard({ label, value, sub }: Props) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-1"
      style={{ backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.7)' }}
    >
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-extrabold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}
