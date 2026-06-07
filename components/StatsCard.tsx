interface Props {
  label: string
  value: string | number
  sub?: string
}

export function StatsCard({ label, value, sub }: Props) {
  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--line)',
      borderRadius: '18px',
      padding: '14px 15px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <p style={{
        color: 'var(--muted)',
        fontWeight: 800,
        fontSize: '10.5px',
        textTransform: 'uppercase',
        letterSpacing: '.5px',
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: 'var(--font-unbounded, sans-serif)',
        fontWeight: 600,
        fontSize: '26px',
        marginTop: '6px',
        color: 'var(--ink)',
        lineHeight: 1,
      }}>
        {value}
      </p>
      {sub && (
        <p style={{ color: 'var(--muted)', fontSize: '10px', marginTop: '4px', fontWeight: 700 }}>
          {sub}
        </p>
      )}
    </div>
  )
}
