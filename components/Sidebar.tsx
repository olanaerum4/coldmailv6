'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/campaigns', label: 'Kampanjer', icon: '◈' },
  { href: '/inbox', label: 'Innboks', icon: '◉' },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside className="w-52 shrink-0 border-r border-zinc-800 flex flex-col bg-zinc-950">
      <div className="px-5 py-6 border-b border-zinc-800">
        <span className="font-mono text-sm font-bold tracking-widest text-cyan-400">OUTREACH<span className="text-zinc-500">OS</span></span>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ href, label, icon }) => {
          const active = path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                active
                  ? 'bg-cyan-950/60 text-cyan-300'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              }`}
            >
              <span className="text-xs">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-zinc-800">
        <p className="text-[10px] text-zinc-600 font-mono">v0.1.0</p>
      </div>
    </aside>
  )
}
