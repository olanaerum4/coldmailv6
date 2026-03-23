'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

function warmupTarget(day: number): number {
  if (day <= 1) return 2
  if (day <= 3) return 4
  if (day <= 5) return 6
  if (day <= 7) return 9
  if (day <= 10) return 12
  if (day <= 14) return 16
  if (day <= 18) return 20
  if (day <= 22) return 25
  return Math.min(40, 30 + (day - 26) * 2)
}

export default function WarmupClient({ schedules, mailboxes }: { schedules: any[]; mailboxes: any[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState('')
  const [adding, setAdding] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  const alreadyInWarmup = schedules.map((s: any) => s.mailbox_id)
  const available = mailboxes.filter((m) => !alreadyInWarmup.includes(m.id))

  async function handleAdd() {
    if (!selected) return
    setAdding(true)
    await fetch('/api/warmup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mailbox_id: selected }),
    })
    setSelected('')
    setAdding(false)
    router.refresh()
  }

  async function handleToggle(id: string, active: boolean) {
    setToggling(id)
    await fetch(`/api/warmup/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    setToggling(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Stopp warm-up for denne mailboksen?')) return
    await fetch(`/api/warmup/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Add mailbox to warmup */}
      {available.length > 0 && (
        <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Start warm-up
          </h2>
          <div className="flex gap-3">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="flex-1 font-mono text-sm px-3 py-2 rounded-lg"
              style={{ border: '1px solid var(--border-strong)', background: '#f8fafc', color: 'var(--text)', outline: 'none' }}
            >
              <option value="">Velg mailboks...</option>
              {available.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={adding || !selected}
              className="px-4 py-2 text-sm font-mono font-bold rounded-lg text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {adding ? '...' : 'Start warm-up'}
            </button>
          </div>
        </div>
      )}

      {/* Active warmup schedules */}
      {schedules.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ border: '2px dashed var(--border)', background: '#fff' }}>
          <p className="font-mono text-sm" style={{ color: 'var(--text-faint)' }}>
            {mailboxes.length < 2
              ? 'Du trenger minst 2 aktive mailbokser for å starte warm-up'
              : 'Ingen mailbokser i warm-up ennå'}
          </p>
        </div>
      ) : (
        schedules.map((s: any) => {
          const target = warmupTarget(s.day)
          const pct = Math.min(100, Math.round(((s.emails_today ?? 0) / target) * 100))
          const dayPct = Math.min(100, Math.round((s.day / 30) * 100))

          return (
            <div
              key={s.id}
              className="rounded-xl p-5"
              style={{
                background: '#fff',
                border: '1px solid var(--border)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                opacity: s.active ? 1 : 0.6,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-mono font-bold text-sm" style={{ color: 'var(--text)' }}>
                    {s.mailboxes?.name}
                  </p>
                  <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    {s.mailboxes?.email}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(s.id, s.active)}
                    disabled={toggling === s.id}
                    className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg"
                    style={{
                      border: '1px solid',
                      borderColor: s.active ? '#fca5a5' : 'var(--border)',
                      color: s.active ? '#dc2626' : '#059669',
                      background: s.active ? '#fef2f2' : '#f0fdf4',
                    }}
                  >
                    {toggling === s.id ? '...' : s.active ? 'Pause' : 'Gjenoppta'}
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="px-3 py-1.5 text-xs font-mono rounded-lg"
                    style={{ border: '1px solid var(--border)', color: 'var(--text-faint)', background: '#f8fafc' }}
                  >
                    Stopp
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs font-mono mb-4">
                <div>
                  <p style={{ color: 'var(--text-faint)' }}>Dag</p>
                  <p className="font-bold mt-0.5" style={{ color: 'var(--text)' }}>{s.day} / 30</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-faint)' }}>Mål i dag</p>
                  <p className="font-bold mt-0.5" style={{ color: 'var(--accent)' }}>{target} e-poster</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-faint)' }}>Sendt i dag</p>
                  <p className="font-bold mt-0.5" style={{ color: 'var(--text)' }}>{s.emails_today ?? 0} / {target}</p>
                </div>
              </div>

              {/* Today's progress */}
              <div className="mb-2">
                <div className="flex justify-between text-xs font-mono mb-1" style={{ color: 'var(--text-faint)' }}>
                  <span>Dagens fremgang</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'var(--bg)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
                </div>
              </div>

              {/* Overall warm-up progress */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1" style={{ color: 'var(--text-faint)' }}>
                  <span>Totalt warm-up</span>
                  <span>{dayPct}%</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'var(--bg)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${dayPct}%`, background: '#059669' }} />
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
