'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

function todaySends(sends: any[]): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return sends.filter((s: any) => new Date(s.sent_at) >= today).length
}

export default function MailboxList({ mailboxes }: { mailboxes: any[] }) {
  const router = useRouter()
  const [toggling, setToggling] = useState<string | null>(null)

  async function toggleActive(id: string, current: boolean) {
    setToggling(id)
    await fetch(`/api/mailboxes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !current }),
    })
    setToggling(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Slett denne mailboksen?')) return
    await fetch(`/api/mailboxes/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (mailboxes.length === 0) {
    return (
      <div
        className="rounded-xl p-16 text-center"
        style={{ border: '2px dashed var(--border)', background: '#fff' }}
      >
        <p className="text-2xl mb-3">✉</p>
        <p className="font-mono text-sm font-semibold" style={{ color: 'var(--text)' }}>Ingen mailbokser ennå</p>
        <p className="font-mono text-xs mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>
          Legg til en SMTP-konto for å starte sending
        </p>
        <Link
          href="/mailboxes/new"
          className="px-4 py-2 text-sm font-mono font-bold rounded-lg text-white"
          style={{ background: 'var(--accent)' }}
        >
          + Legg til mailboks
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {mailboxes.map((mb: any) => {
        const sends = mb.mailbox_sends ?? []
        const sentToday = todaySends(sends)
        const pct = Math.min(100, Math.round((sentToday / mb.daily_limit) * 100))

        return (
          <div
            key={mb.id}
            className="rounded-xl p-5"
            style={{
              background: '#fff',
              border: '1px solid var(--border)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              opacity: mb.active ? 1 : 0.6,
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{ background: mb.active ? '#eff6ff' : '#f1f5f9', color: mb.active ? 'var(--accent)' : 'var(--text-faint)' }}
                >
                  ✉
                </div>
                <div>
                  <p className="font-mono font-bold text-sm" style={{ color: 'var(--text)' }}>{mb.name}</p>
                  <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{mb.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/mailboxes/${mb.id}/edit`}
                  className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-colors"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: '#f8fafc' }}
                >
                  Rediger
                </Link>
                <button
                  onClick={() => toggleActive(mb.id, mb.active)}
                  disabled={toggling === mb.id}
                  className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-colors"
                  style={{
                    borderColor: mb.active ? '#fca5a5' : 'var(--border)',
                    color: mb.active ? '#dc2626' : '#059669',
                    background: mb.active ? '#fef2f2' : '#f0fdf4',
                  }}
                >
                  {toggling === mb.id ? '...' : mb.active ? 'Deaktiver' : 'Aktiver'}
                </button>
                <button
                  onClick={() => handleDelete(mb.id)}
                  className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-colors"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-faint)', background: '#f8fafc' }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-4 grid grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <p style={{ color: 'var(--text-faint)' }}>SMTP</p>
                <p className="font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>{mb.smtp_host}:{mb.smtp_port}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-faint)' }}>Daglig limit</p>
                <p className="font-semibold mt-0.5" style={{ color: 'var(--text)' }}>{mb.daily_limit} e-poster</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-faint)' }}>Intervall</p>
                <p className="font-semibold mt-0.5" style={{ color: 'var(--text)' }}>hvert {mb.interval_minutes} min</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-faint)' }}>Sendt i dag</p>
                <p className="font-semibold mt-0.5" style={{ color: sentToday >= mb.daily_limit ? '#dc2626' : 'var(--text)' }}>
                  {sentToday} / {mb.daily_limit}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: pct >= 100 ? '#dc2626' : pct > 75 ? '#f59e0b' : 'var(--accent)',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
