'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/campaigns', label: 'Kampanjer', icon: '◈' },
  { href: '/calendar', label: 'Kalender', icon: '🗓' },
  { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { href: '/scraper', label: 'Lead Scraper', icon: '🔍' },
  { href: '/mailboxes', label: 'Mailbokser', icon: '✉' },
  { href: '/warmup', label: 'Warm-up', icon: '🔥' },
  { href: '/inbox', label: 'Innboks', icon: '◉' },
  { href: '/deals', label: 'Deals', icon: '💸' },
  { href: '/competitors', label: 'Konkurrenter', icon: '📰' },
  { href: '/ai', label: 'AI-assistent', icon: '🤖' },
  { href: '/unsubscribes', label: 'Avmeldte', icon: '⊘' },
  { href: '/agent', label: 'Agent API', icon: '⚡' },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside className="w-52 shrink-0 flex flex-col" style={{ background: '#fff', borderRight: '1px solid var(--border)' }}>
      <Link href="/founder" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 16px', borderBottom: '1px solid var(--border)', textDecoration: 'none', background: '#fafafa' }}>
        <span style={{ fontSize: 15 }}>🏗</span>
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 13, color: '#0f172a' }}>ola<span style={{ color: '#2563eb' }}>.build</span></span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#94a3b8', display: 'block' }}>Alle prosjekter →</span>
        </div>
      </Link>
      <div style={{ padding: '8px 16px 2px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10, color: '#2563eb', letterSpacing: '0.08em', textTransform: 'uppercase' }}>OutreachOS</span>
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon }) => {
          const active = path.startsWith(href)
          return (
            <Link key={href} href={href} className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors font-mono"
              style={{ background: active ? '#eff6ff' : 'transparent', color: active ? 'var(--accent)' : 'var(--text-muted)', fontWeight: active ? '600' : '400', textDecoration: 'none', fontSize: 12 }}>
              <span style={{ fontSize: 11 }}>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>v0.7.0</p>
      </div>
    </aside>
  )
}
