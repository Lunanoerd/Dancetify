'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  {
    href: '/',
    label: 'Timetable',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="23" height="23">
        <rect x="3" y="4.5" width="18" height="16" rx="3.5" />
        <path d="M3 9h18M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    href: '/saved',
    label: 'Saved',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="23" height="23">
        <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z" />
      </svg>
    ),
  },
  {
    href: '/dashboard',
    label: 'Progress',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="23" height="23">
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    ),
  },
]

export function TabBar() {
  const pathname = usePathname()

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(calc(100% - 28px), 484px)',
        height: '64px',
        borderRadius: '24px',
        background: 'var(--tabbar-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--line)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 50,
        boxShadow: '0 8px 30px rgba(53,43,61,.12)',
      }}
    >
      {TABS.map(tab => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              color: active ? 'var(--ink)' : 'var(--muted)',
              fontFamily: 'var(--font-nunito), Nunito, sans-serif',
              fontWeight: 800,
              fontSize: '10.5px',
              flex: 1,
              textDecoration: 'none',
              transition: 'color .12s',
            }}
          >
            <span
              style={{
                color: active ? 'var(--accent)' : 'var(--muted)',
                filter: active ? 'drop-shadow(0 0 8px var(--accent))' : 'none',
                transition: 'color .12s, filter .12s',
              }}
            >
              {tab.icon}
            </span>
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
