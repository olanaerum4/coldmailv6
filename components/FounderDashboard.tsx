'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import MRRGraph from '@/components/MRRGraph'

type Status = 'active' | 'building' | 'paused' | 'idea'

interface Project {
  id: string
  name: string
  description?: string
  url?: string
  status: Status
  mrr: number
  customers: number
  emoji: string
  color: string
  sort_order: number
  supabase_url?: string
  supabase_service_key?: string
  auto_sync?: boolean
}

interface Todo {
  id: string
  project_id: string
  text: string
  done: boolean
}

interface Snapshot {
  project_id: string
  mrr: number
  customers: number
  recorded_at: string
}

const STATUS_CONFIG: Record<Status, { label: string; bg: string; color: string }> = {
  active:   { label: 'Aktiv',    bg: '#d1fae5', color: '#065f46' },
  building: { label: 'Bygger',   bg: '#dbeafe', color: '#1e40af' },
  paused:   { label: 'Pauset',   bg: '#fef9c3', color: '#854d0e' },
  idea:     { label: 'Idé',      bg: '#f3e8ff', color: '#6b21a8' },
}

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export default function FounderDashboard({
  initialProjects,
  initialTodos,
  initialSnapshots,
}: {
  initialProjects: Project[]
  initialTodos: Todo[]
  initialSnapshots: Snapshot[]
}) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [editing, setEditing] = useState<string | null>(null)
  const [showIntegration, setShowIntegration] = useState<string | null>(null)
  const [newTodo, setNewTodo] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [editData, setEditData] = useState<Partial<Project>>({})

  const totalMRR = projects.reduce((s, p) => s + (p.mrr ?? 0), 0)
  const totalCustomers = projects.reduce((s, p) => s + (p.customers ?? 0), 0)
  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'building').length

  // MRR change vs yesterday
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  const yesterdayMRR = initialSnapshots
    .filter(s => s.recorded_at === yesterdayStr)
    .reduce((sum, s) => sum + s.mrr, 0)
  const mrrDelta = totalMRR - yesterdayMRR

  function startEdit(p: Project) {
    setEditing(p.id)
    setEditData({ name: p.name, description: p.description, url: p.url, status: p.status, mrr: p.mrr, customers: p.customers, emoji: p.emoji, color: p.color })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const res = await fetch(`/api/founder/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData),
    })
    const updated = await res.json()
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p))
    setEditing(null)
    setSaving(false)
  }

  async function saveIntegration(id: string, data: Partial<Project>) {
    await fetch(`/api/founder/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    setShowIntegration(null)
  }

  async function syncNow() {
    setSyncing(true)
    await fetch('/api/cron/mrr-sync', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ''}` },
    })
    setSyncing(false)
    router.refresh()
  }

  async function addTodo(projectId: string) {
    const text = newTodo[projectId]?.trim()
    if (!text) return
    const res = await fetch('/api/founder/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, text }),
    })
    const todo = await res.json()
    setTodos(prev => [...prev, todo])
    setNewTodo(prev => ({ ...prev, [projectId]: '' }))
  }

  async function toggleTodo(todo: Todo) {
    await fetch(`/api/founder/todos/${todo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !todo.done }),
    })
    setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, done: !t.done } : t))
  }

  async function deleteTodo(id: string) {
    await fetch(`/api/founder/todos/${id}`, { method: 'DELETE' })
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  async function addProject() {
    const res = await fetch('/api/founder/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Nytt prosjekt', status: 'idea', emoji: '💡', color: '#64748b', mrr: 0, customers: 0 }),
    })
    const p = await res.json()
    setProjects(prev => [...prev, p])
    startEdit(p.id)
  }

  const is = (s: string) => ({ border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', outline: 'none', fontFamily: 'var(--font-mono)', fontSize: 13, padding: '7px 10px', borderRadius: 8, width: '100%' } as React.CSSProperties)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 15, color: '#0f172a' }}>
              ola<span style={{ color: '#2563eb' }}>.build</span>
            </span>
            <nav style={{ display: 'flex', gap: 4 }}>
              {[
                { label: '📋 Prosjekter', href: '/founder' },
                { label: '💡 Idéer', href: '/ideas' },
                { label: '📧 OutreachOS', href: '/dashboard' },
              ].map(({ label, href }) => (
                <Link key={href} href={href} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: '#64748b', padding: '4px 10px', borderRadius: 6, textDecoration: 'none' }}>
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={syncNow}
              disabled={syncing}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}
            >
              {syncing ? '⟳ Syncer...' : '⟳ Sync MRR'}
            </button>
            <button
              onClick={addProject}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}
            >
              + Nytt prosjekt
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 2rem' }}>
        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total MRR', value: `${totalMRR.toLocaleString('nb-NO')} kr`, delta: mrrDelta !== 0 ? `${mrrDelta > 0 ? '+' : ''}${mrrDelta.toLocaleString('nb-NO')} kr vs i går` : null, color: '#2563eb', icon: '💰' },
            { label: 'Kunder totalt', value: fmt(totalCustomers), delta: null, color: '#059669', icon: '👥' },
            { label: 'Aktive prosjekter', value: String(activeProjects), delta: null, color: '#7c3aed', icon: '🚀' },
          ].map(({ label, value, delta, color, icon }) => (
            <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 800, color }}>{value}</span>
              {delta && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: mrrDelta > 0 ? '#059669' : '#dc2626', margin: '4px 0 0' }}>{delta}</p>}
            </div>
          ))}
        </div>

        {/* Project cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {projects.map(p => {
            const projectTodos = todos.filter(t => t.project_id === p.id)
            const openTodos = projectTodos.filter(t => !t.done)
            const isEditing = editing === p.id
            const isIntegration = showIntegration === p.id
            const sc = STATUS_CONFIG[p.status]
            const snapshots = initialSnapshots
              .filter(s => s.project_id === p.id)
              .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
              .slice(-30)

            return (
              <div key={p.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                {/* Color stripe */}
                <div style={{ height: 4, background: p.color }} />

                <div style={{ padding: '16px 18px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{p.emoji}</span>
                      <div>
                        {isEditing ? (
                          <input value={editData.name ?? ''} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} style={{ ...is(''), fontSize: 15, fontWeight: 700, width: 160 }} />
                        ) : (
                          <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>{p.name}</h2>
                        )}
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: sc.bg, color: sc.color, display: 'inline-block', marginTop: 3 }}>
                          {sc.label}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => setShowIntegration(isIntegration ? null : p.id)}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, background: p.auto_sync ? '#d1fae5' : '#f1f5f9', color: p.auto_sync ? '#065f46' : '#64748b', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}
                        title="Koble til ekstern datakilde"
                      >
                        {p.auto_sync ? '🔗 Koblet' : '🔗'}
                      </button>
                      <button
                        onClick={() => isEditing ? saveEdit(p.id) : startEdit(p)}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, background: isEditing ? '#2563eb' : '#f1f5f9', color: isEditing ? '#fff' : '#64748b', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
                      >
                        {saving && isEditing ? '...' : isEditing ? 'Lagre' : 'Rediger'}
                      </button>
                    </div>
                  </div>

                  {/* Edit mode */}
                  {isEditing && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: 2 }}>MRR (kr)</label>
                        <input type="number" value={editData.mrr ?? 0} onChange={e => setEditData(d => ({ ...d, mrr: parseInt(e.target.value) || 0 }))} style={is('')} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Kunder</label>
                        <input type="number" value={editData.customers ?? 0} onChange={e => setEditData(d => ({ ...d, customers: parseInt(e.target.value) || 0 }))} style={is('')} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: 2 }}>URL</label>
                        <input value={editData.url ?? ''} onChange={e => setEditData(d => ({ ...d, url: e.target.value }))} placeholder="https://..." style={is('')} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Status</label>
                        <select value={editData.status} onChange={e => setEditData(d => ({ ...d, status: e.target.value as Status }))} style={is('')}>
                          <option value="active">Aktiv</option>
                          <option value="building">Bygger</option>
                          <option value="paused">Pauset</option>
                          <option value="idea">Idé</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Emoji</label>
                        <input value={editData.emoji ?? ''} onChange={e => setEditData(d => ({ ...d, emoji: e.target.value }))} style={{ ...is(''), width: 60 }} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: 2 }}>Farge</label>
                        <input type="color" value={editData.color ?? '#2563eb'} onChange={e => setEditData(d => ({ ...d, color: e.target.value }))} style={{ ...is(''), padding: 2, height: 34 }} />
                      </div>
                    </div>
                  )}

                  {/* Integration panel */}
                  {isIntegration && (
                    <IntegrationPanel project={p} onSave={saveIntegration} onClose={() => setShowIntegration(null)} />
                  )}

                  {/* Stats */}
                  {!isEditing && !isIntegration && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', margin: '0 -18px', padding: '10px 18px' }}>
                        {[
                          { label: 'MRR', value: `${(p.mrr ?? 0).toLocaleString('nb-NO')} kr`, color: p.mrr > 0 ? '#059669' : '#94a3b8' },
                          { label: 'Kunder', value: fmt(p.customers ?? 0), color: p.customers > 0 ? '#2563eb' : '#94a3b8' },
                          { label: 'Åpent', value: openTodos.length > 0 ? `${openTodos.length} oppg.` : '✓ ferdig', color: openTodos.length > 0 ? '#d97706' : '#059669' },
                        ].map(({ label, value, color }) => (
                          <div key={label}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color }}>{value}</div>
                          </div>
                        ))}
                      </div>

                      {/* MRR graph */}
                      {snapshots.length >= 2 && (
                        <div style={{ margin: '12px 0 8px' }}>
                          <MRRGraph snapshots={snapshots} projectName={p.name} color={p.color} />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Todos */}
                {!isEditing && !isIntegration && (
                  <div style={{ padding: '0 18px 14px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Neste</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
                      {projectTodos.slice(0, 4).map(todo => (
                        <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <button
                            onClick={() => toggleTodo(todo)}
                            style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${todo.done ? '#059669' : '#cbd5e1'}`, background: todo.done ? '#059669' : 'transparent', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            {todo.done && <span style={{ color: '#fff', fontSize: 8, fontWeight: 900 }}>✓</span>}
                          </button>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: todo.done ? '#94a3b8' : '#0f172a', textDecoration: todo.done ? 'line-through' : 'none', flex: 1 }}>
                            {todo.text}
                          </span>
                          <button onClick={() => deleteTodo(todo.id)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 12 }}>×</button>
                        </div>
                      ))}
                    </div>
                    <input
                      value={newTodo[p.id] ?? ''}
                      onChange={e => setNewTodo(prev => ({ ...prev, [p.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addTodo(p.id)}
                      placeholder="+ ny oppgave..."
                      style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 11, padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, outline: 'none', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' }}
                    />
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#2563eb', textDecoration: 'none', display: 'inline-block', marginTop: 6 }}>
                        ↗ {p.url.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function IntegrationPanel({ project, onSave, onClose }: { project: Project; onSave: (id: string, data: any) => void; onClose: () => void }) {
  const [url, setUrl] = useState(project.supabase_url ?? '')
  const [key, setKey] = useState(project.supabase_service_key ?? '')
  const [autoSync, setAutoSync] = useState(project.auto_sync ?? false)

  const is = { border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', outline: 'none', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '6px 10px', borderRadius: 8, width: '100%' } as React.CSSProperties

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginBottom: 12 }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', margin: '0 0 8px' }}>
        🔗 Koble til Supabase (auto-sync MRR)
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://xxxx.supabase.co" style={is} />
        <input type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="service_role key" style={is} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: '#64748b', cursor: 'pointer' }}>
          <input type="checkbox" checked={autoSync} onChange={e => setAutoSync(e.target.checked)} />
          Auto-sync daglig via cron
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onSave(project.id, { supabase_url: url, supabase_service_key: key, auto_sync: autoSync })}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', cursor: 'pointer' }}
          >
            Lagre
          </button>
          <button onClick={onClose} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer' }}>
            Avbryt
          </button>
        </div>
      </div>
    </div>
  )
}
