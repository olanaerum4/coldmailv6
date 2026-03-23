'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/campaigns', label: 'Kampanjer', icon: '◈' },
  { href: '/scraper', label: 'Lead Scraper', icon: '🔍' },
  { href: '/mailboxes', label: 'Mailbokser', icon: '✉' },
  { href: '/warmup', label: 'Warm-up', icon: '🔥' },
  { href: '/inbox', label: 'Innboks', icon: '◉' },
  { href: '/unsubscribes', label: 'Avmeldte', icon: '⊘' },
  { href: '/agent', label: 'Agent API', icon: '⚡' },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside className="w-52 shrink-0 flex flex-col" style={{ background: '#fff', borderRight: '1px solid var(--border)' }}>
      <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="font-mono text-sm font-bold tracking-widest" style={{ color: 'var(--accent)' }}>
          OUTREACH<span style={{ color: 'var(--text-faint)' }}>OS</span>
        </span>
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon }) => {
          const active = path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors font-mono"
              style={{
                background: active ? '#eff6ff' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: active ? '600' : '400',
              }}
            >
              <span className="text-xs">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>v0.4.0</p>
      </div>
    </aside>
  )
}
