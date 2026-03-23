'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import crypto from 'crypto'

export default function AgentKeysClient({ keys }: { keys: any[] }) {
  const router = useRouter()
  const [newName, setNewName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    if (!newName) return
    setCreating(true)
    const res = await fetch('/api/agent-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    })
    const data = await res.json()
    setNewKey(data.key)
    setNewName('')
    setCreating(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Slett denne nøkkelen?')) return
    await fetch(`/api/agent-keys/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  const inputStyle = {
    background: '#f8fafc',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '14px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text)',
    outline: 'none',
  } as React.CSSProperties

  return (
    <div>
      {/* New key shown once */}
      {newKey && (
        <div className="rounded-xl p-4 mb-6" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
          <p className="text-xs font-mono font-bold mb-2" style={{ color: '#166534' }}>
            ✓ Nøkkel opprettet – kopier den nå, den vises ikke igjen!
          </p>
          <code className="text-sm font-mono px-3 py-2 rounded-lg block" style={{ background: '#166534', color: '#dcfce7' }}>
            {newKey}
          </code>
          <button
            onClick={() => { navigator.clipboard.writeText(newKey); setNewKey(null) }}
            className="mt-2 text-xs font-mono font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: '#166534', color: '#dcfce7' }}
          >
            Kopier og lukk
          </button>
        </div>
      )}

      {/* Create new */}
      <div className="rounded-xl p-5 mb-6" style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <h2 className="text-xs font-mono font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Opprett ny nøkkel</h2>
        <div className="flex gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="OpenClaw agent"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName}
            className="px-4 py-2 text-sm font-mono font-bold rounded-lg text-white disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            {creating ? '...' : 'Opprett'}
          </button>
        </div>
      </div>

      {/* Existing keys */}
      {keys.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <table className="w-full text-sm font-mono">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Navn</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Sist brukt</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Opprettet</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody>
              {keys.map((k, i) => (
                <tr key={k.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : 'var(--bg)' }}>
                  <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text)' }}>{k.name}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                    {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString('nb-NO') : '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                    {new Date(k.created_at).toLocaleDateString('nb-NO')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(k.id)} className="text-xs font-mono px-2 py-1 rounded" style={{ color: '#dc2626' }}>
                      Slett
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
