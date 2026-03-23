'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UnsubscribeClient({ list }: { list: any[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)

  const filtered = list.filter((u) =>
    !search || u.email.toLowerCase().includes(search.toLowerCase())
  )

  async function handleAdd() {
    if (!newEmail.includes('@')) return
    setAdding(true)
    await fetch('/api/unsubscribes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, reason: 'manual' }),
    })
    setNewEmail('')
    setAdding(false)
    router.refresh()
  }

  async function handleRemove(email: string) {
    await fetch('/api/unsubscribes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    router.refresh()
  }

  const reasonBadge = (r: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      manual:      { bg: '#f1f5f9', color: '#475569' },
      unsubscribe: { bg: '#fef3c7', color: '#92400e' },
      bounce:      { bg: '#fee2e2', color: '#991b1b' },
      complaint:   { bg: '#fce7f3', color: '#9d174d' },
    }
    const s = map[r] ?? map.manual
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono" style={{ background: s.bg, color: s.color }}>
        {r}
      </span>
    )
  }

  return (
    <div>
      {/* Add manually */}
      <div className="rounded-xl p-4 mb-6 flex gap-3" style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <input
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="legg-til@epost.no"
          className="flex-1 font-mono text-sm px-3 py-2 rounded-lg"
          style={{ border: '1px solid var(--border-strong)', outline: 'none', background: '#f8fafc', color: 'var(--text)' }}
        />
        <button
          onClick={handleAdd}
          disabled={adding}
          className="px-4 py-2 text-sm font-mono font-bold rounded-lg text-white disabled:opacity-50"
          style={{ background: 'var(--accent)' }}
        >
          {adding ? '...' : '+ Legg til'}
        </button>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Søk..."
          className="font-mono text-sm px-3 py-2 rounded-lg w-40"
          style={{ border: '1px solid var(--border)', outline: 'none', background: '#f8fafc', color: 'var(--text)' }}
        />
      </div>

      {/* List */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-mono text-sm" style={{ color: 'var(--text-faint)' }}>
              {search ? 'Ingen treff' : 'Ingen avmeldte ennå'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm font-mono">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>E-post</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Årsak</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Dato</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : 'var(--bg)' }}>
                  <td className="px-4 py-3" style={{ color: 'var(--text)' }}>{u.email}</td>
                  <td className="px-4 py-3">{reasonBadge(u.reason ?? 'manual')}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                    {new Date(u.created_at).toLocaleDateString('nb-NO')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRemove(u.email)}
                      className="text-xs font-mono px-2 py-1 rounded"
                      style={{ color: 'var(--text-faint)', background: 'transparent' }}
                    >
                      × fjern
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
