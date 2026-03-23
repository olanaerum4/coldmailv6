'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Stage = 'lead' | 'contacted' | 'demo' | 'proposal' | 'won' | 'lost'

interface Deal {
  id: string
  project_id: string | null
  name: string
  company?: string
  contact_email?: string
  value: number
  probability: number
  stage: Stage
  notes?: string
  expected_close?: string
  created_at: string
}

const STAGES: { id: Stage; label: string; color: string; bg: string }[] = [
  { id: 'lead',      label: 'Lead',      color: '#64748b', bg: '#f1f5f9' },
  { id: 'contacted', label: 'Kontaktet', color: '#2563eb', bg: '#dbeafe' },
  { id: 'demo',      label: 'Demo',      color: '#7c3aed', bg: '#ede9fe' },
  { id: 'proposal',  label: 'Tilbud',    color: '#d97706', bg: '#fef3c7' },
  { id: 'won',       label: '🎉 Vunnet', color: '#059669', bg: '#d1fae5' },
  { id: 'lost',      label: 'Tapt',      color: '#dc2626', bg: '#fee2e2' },
]

const DEFAULT_PROBS: Record<Stage, number> = {
  lead: 10, contacted: 25, demo: 50, proposal: 75, won: 100, lost: 0
}

export default function DealsClient({ deals: initial, projects }: { deals: Deal[]; projects: any[] }) {
  const router = useRouter()
  const [deals, setDeals] = useState<Deal[]>(initial)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', company: '', contact_email: '', value: '', stage: 'lead' as Stage, project_id: '', notes: '' })
  const [saving, setSaving] = useState(false)

  // Pipeline stats
  const activeDeals = deals.filter(d => d.stage !== 'won' && d.stage !== 'lost')
  const totalPipeline = activeDeals.reduce((s, d) => s + d.value, 0)
  const weightedPipeline = activeDeals.reduce((s, d) => s + d.value * (d.probability / 100), 0)
  const wonDeals = deals.filter(d => d.stage === 'won')
  const wonValue = wonDeals.reduce((s, d) => s + d.value, 0)

  async function handleAdd() {
    if (!form.name) return
    setSaving(true)
    const res = await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        value: parseInt(form.value) || 0,
        probability: DEFAULT_PROBS[form.stage],
        project_id: form.project_id || null,
      }),
    })
    const deal = await res.json()
    setDeals(prev => [deal, ...prev])
    setForm({ name: '', company: '', contact_email: '', value: '', stage: 'lead', project_id: '', notes: '' })
    setAdding(false)
    setSaving(false)
  }

  async function updateStage(id: string, stage: Stage) {
    await fetch(`/api/deals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage, probability: DEFAULT_PROBS[stage] }),
    })
    setDeals(prev => prev.map(d => d.id === id ? { ...d, stage, probability: DEFAULT_PROBS[stage] } : d))
  }

  async function deleteDeal(id: string) {
    await fetch(`/api/deals/${id}`, { method: 'DELETE' })
    setDeals(prev => prev.filter(d => d.id !== id))
  }

  const is = { border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', outline: 'none', fontFamily: 'var(--font-mono)', fontSize: 13, padding: '7px 10px', borderRadius: 8 } as React.CSSProperties

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Pipeline', value: `${totalPipeline.toLocaleString('nb-NO')} kr`, color: '#2563eb' },
          { label: 'Vektet pipeline', value: `${Math.round(weightedPipeline).toLocaleString('nb-NO')} kr`, color: '#7c3aed' },
          { label: 'Aktive deals', value: String(activeDeals.length), color: '#d97706' },
          { label: 'Vunnet', value: `${wonValue.toLocaleString('nb-NO')} kr`, color: '#059669' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 4px' }}>{label}</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 800, color, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Kanban board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: 24 }}>
        {STAGES.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage.id)
          return (
            <div key={stage.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: stage.color }}>{stage.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: stage.bg, color: stage.color, padding: '1px 6px', borderRadius: 99 }}>{stageDeals.length}</span>
              </div>
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6, minHeight: 60 }}>
                {stageDeals.map(deal => (
                  <div key={deal.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>{deal.name}</p>
                    {deal.company && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#64748b', margin: '0 0 4px' }}>{deal.company}</p>}
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#059669', margin: '0 0 6px' }}>
                      {deal.value.toLocaleString('nb-NO')} kr
                    </p>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {STAGES.filter(s => s.id !== deal.stage).slice(0, 2).map(s => (
                        <button key={s.id} onClick={() => updateStage(deal.id, s.id)}
                          style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, background: s.bg, color: s.color, border: 'none', borderRadius: 4, padding: '2px 5px', cursor: 'pointer' }}>
                          → {s.label}
                        </button>
                      ))}
                      <button onClick={() => deleteDeal(deal.id)}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 9, background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 4, padding: '2px 5px', cursor: 'pointer' }}>
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add deal */}
      {adding ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 14px' }}>Ny deal</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Navn / tittel *" style={{ ...is, width: '100%' }} />
            <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Selskap" style={{ ...is, width: '100%' }} />
            <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="Verdi (kr)" type="number" style={{ ...is, width: '100%' }} />
            <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as Stage }))} style={{ ...is, width: '100%' }}>
              {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 12 }}>
            <input value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="Kontakt-epost" type="email" style={{ ...is, width: '100%' }} />
            <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} style={{ ...is, width: '100%' }}>
              <option value="">Ikke tilknyttet</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAdd} disabled={saving || !form.name}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', opacity: saving || !form.name ? 0.5 : 1 }}>
              {saving ? '...' : 'Legg til deal'}
            </button>
            <button onClick={() => setAdding(false)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, padding: '9px 16px', cursor: 'pointer' }}>
              Avbryt
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', cursor: 'pointer' }}>
          + Ny deal
        </button>
      )}
    </div>
  )
}
