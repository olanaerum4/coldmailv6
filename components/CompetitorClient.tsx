'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CompetitorClient({ competitors: initial, changes, projects }: any) {
  const router = useRouter()
  const [competitors, setCompetitors] = useState(initial)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', url: '', project_id: '' })
  const [checking, setChecking] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!form.name || !form.url) return
    setSaving(true)
    const res = await fetch('/api/competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, project_id: form.project_id || null }),
    })
    const c = await res.json()
    setCompetitors((p: any) => [c, ...p])
    setForm({ name: '', url: '', project_id: '' })
    setAdding(false)
    setSaving(false)
  }

  async function checkNow(id: string) {
    setChecking(id)
    await fetch(`/api/competitors/${id}/check`, { method: 'POST' })
    setChecking(null)
    router.refresh()
  }

  async function deleteCompetitor(id: string) {
    await fetch(`/api/competitors/${id}`, { method: 'DELETE' })
    setCompetitors((p: any) => p.filter((c: any) => c.id !== id))
  }

  const is = { border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', outline: 'none', fontFamily: 'var(--font-mono)', fontSize: 13, padding: '7px 10px', borderRadius: 8 } as React.CSSProperties

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Recent changes */}
      {changes.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>🔔 Nylige endringer</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {changes.slice(0, 5).map((c: any) => (
              <div key={c.id} style={{ padding: '10px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8 }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#0f172a', margin: '0 0 2px' }}>{c.summary}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', margin: 0 }}>
                  {new Date(c.detected_at).toLocaleDateString('nb-NO')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitors list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {competitors.map((c: any) => (
          <div key={c.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>{c.name}</p>
              <a href={c.url} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#2563eb', textDecoration: 'none' }}>
                {c.url.replace(/^https?:\/\//, '')}
              </a>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8' }}>
              {c.last_checked_at ? `Sjekket ${new Date(c.last_checked_at).toLocaleDateString('nb-NO')}` : 'Aldri sjekket'}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => checkNow(c.id)} disabled={checking === c.id}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: 7, padding: '5px 10px', cursor: 'pointer' }}>
                {checking === c.id ? '...' : '🔍 Sjekk nå'}
              </button>
              <button onClick={() => deleteCompetitor(c.id)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 7, padding: '5px 8px', cursor: 'pointer' }}>
                ×
              </button>
            </div>
          </div>
        ))}

        {competitors.length === 0 && !adding && (
          <div style={{ background: '#fff', border: '2px dashed #e2e8f0', borderRadius: 16, padding: 40, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#94a3b8' }}>Ingen konkurrenter ennå</p>
          </div>
        )}
      </div>

      {/* Add form */}
      {adding ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 10, marginBottom: 10 }}>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Navn *" style={{ ...is, width: '100%' }} />
            <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://konkurrent.no *" style={{ ...is, width: '100%' }} />
            <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} style={{ ...is, width: '100%' }}>
              <option value="">Ikke tilknyttet</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAdd} disabled={saving}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer' }}>
              {saving ? '...' : 'Legg til'}
            </button>
            <button onClick={() => setAdding(false)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}>
              Avbryt
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', cursor: 'pointer', alignSelf: 'flex-start' }}>
          + Legg til konkurrent
        </button>
      )}
    </div>
  )
}
