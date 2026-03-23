'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
}

interface Todo {
  id: string
  project_id: string
  text: string
  done: boolean
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
}: {
  initialProjects: Project[]
  initialTodos: Todo[]
}) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [editing, setEditing] = useState<string | null>(null)
  const [newTodo, setNewTodo] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState<Partial<Project>>({})

  // Totals
  const totalMRR = projects.reduce((s, p) => s + (p.mrr ?? 0), 0)
  const totalCustomers = projects.reduce((s, p) => s + (p.customers ?? 0), 0)
  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'building').length

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

  const inputCls = "w-full font-mono text-sm px-2.5 py-1.5 rounded-lg"
  const inputStyle = { border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', outline: 'none', fontFamily: 'var(--font-mono)' } as React.CSSProperties

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Top nav bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 15, color: '#0f172a', letterSpacing: '-0.5px' }}>
              ola<span style={{ color: '#2563eb' }}>.build</span>
            </span>
            <nav style={{ display: 'flex', gap: 4 }}>
              {[
                { label: 'Prosjekter', href: '/founder' },
                { label: 'OutreachOS', href: '/dashboard' },
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#64748b',
                    padding: '4px 12px',
                    borderRadius: 6,
                    textDecoration: 'none',
                    background: 'transparent',
                  }}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <button
            onClick={addProject}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}
          >
            + Nytt prosjekt
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 2rem' }}>
        {/* Summary strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total MRR', value: `${totalMRR.toLocaleString('nb-NO')} kr`, color: '#2563eb', icon: '💰' },
            { label: 'Kunder totalt', value: fmt(totalCustomers), color: '#059669', icon: '👥' },
            { label: 'Aktive prosjekter', value: String(activeProjects), color: '#7c3aed', icon: '🚀' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 800, color }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Project cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {projects.map(p => {
            const projectTodos = todos.filter(t => t.project_id === p.id)
            const openTodos = projectTodos.filter(t => !t.done)
            const isEditing = editing === p.id
            const sc = STATUS_CONFIG[p.status]

            return (
              <div
                key={p.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 20,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                {/* Card header */}
                <div style={{ borderBottom: '4px solid', borderColor: p.color, padding: '20px 20px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 28 }}>{p.emoji}</span>
                      <div>
                        {isEditing ? (
                          <input
                            value={editData.name ?? ''}
                            onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                            className={inputCls}
                            style={{ ...inputStyle, fontSize: 16, fontWeight: 700, width: 180 }}
                          />
                        ) : (
                          <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                            {p.name}
                          </h2>
                        )}
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: sc.bg, color: sc.color, marginTop: 4, display: 'inline-block' }}>
                          {sc.label}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => isEditing ? saveEdit(p.id) : startEdit(p)}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, background: isEditing ? '#2563eb' : '#f1f5f9', color: isEditing ? '#fff' : '#64748b', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}
                    >
                      {saving && isEditing ? '...' : isEditing ? 'Lagre' : 'Rediger'}
                    </button>
                  </div>

                  {isEditing ? (
                    <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 3 }}>BESKRIVELSE</label>
                        <input value={editData.description ?? ''} onChange={e => setEditData(d => ({ ...d, description: e.target.value }))} className={inputCls} style={inputStyle} placeholder="Kort beskrivelse" />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 3 }}>URL</label>
                        <input value={editData.url ?? ''} onChange={e => setEditData(d => ({ ...d, url: e.target.value }))} className={inputCls} style={inputStyle} placeholder="https://..." />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 3 }}>MRR (kr)</label>
                        <input type="number" value={editData.mrr ?? 0} onChange={e => setEditData(d => ({ ...d, mrr: parseInt(e.target.value) || 0 }))} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 3 }}>KUNDER</label>
                        <input type="number" value={editData.customers ?? 0} onChange={e => setEditData(d => ({ ...d, customers: parseInt(e.target.value) || 0 }))} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 3 }}>EMOJI</label>
                        <input value={editData.emoji ?? ''} onChange={e => setEditData(d => ({ ...d, emoji: e.target.value }))} className={inputCls} style={{ ...inputStyle, width: 60 }} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 3 }}>STATUS</label>
                        <select value={editData.status} onChange={e => setEditData(d => ({ ...d, status: e.target.value as Status }))} className={inputCls} style={{ ...inputStyle, width: '100%' }}>
                          <option value="active">Aktiv</option>
                          <option value="building">Bygger</option>
                          <option value="paused">Pauset</option>
                          <option value="idea">Idé</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {p.description && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#64748b', margin: '8px 0 0' }}>{p.description}</p>}
                    </div>
                  )}
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid #f1f5f9' }}>
                  {[
                    { label: 'MRR', value: `${(p.mrr ?? 0).toLocaleString('nb-NO')} kr`, color: p.mrr > 0 ? '#059669' : '#94a3b8' },
                    { label: 'Kunder', value: fmt(p.customers ?? 0), color: p.customers > 0 ? '#2563eb' : '#94a3b8' },
                    { label: 'Oppgaver', value: openTodos.length > 0 ? `${openTodos.length} åpne` : '✓ alt gjort', color: openTodos.length > 0 ? '#d97706' : '#059669' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ padding: '12px 16px', borderRight: '1px solid #f1f5f9' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Todos */}
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>Neste oppgaver</div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                    {projectTodos.slice(0, 4).map(todo => (
                      <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => toggleTodo(todo)}
                          style={{
                            width: 16, height: 16, borderRadius: 4, border: `2px solid ${todo.done ? '#059669' : '#cbd5e1'}`,
                            background: todo.done ? '#059669' : 'transparent', cursor: 'pointer', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          {todo.done && <span style={{ color: '#fff', fontSize: 9, fontWeight: 900 }}>✓</span>}
                        </button>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 12, color: todo.done ? '#94a3b8' : '#0f172a',
                          textDecoration: todo.done ? 'line-through' : 'none', flex: 1
                        }}>
                          {todo.text}
                        </span>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 14, padding: '0 2px' }}
                        >×</button>
                      </div>
                    ))}
                    {projectTodos.length === 0 && (
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#cbd5e1', margin: 0 }}>Ingen oppgaver</p>
                    )}
                  </div>

                  {/* Add todo inline */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      value={newTodo[p.id] ?? ''}
                      onChange={e => setNewTodo(prev => ({ ...prev, [p.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addTodo(p.id)}
                      placeholder="+ Legg til oppgave..."
                      style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none', background: '#f8fafc', color: '#0f172a' }}
                    />
                  </div>

                  {/* Link to project */}
                  {p.url && !isEditing && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#2563eb', textDecoration: 'none', display: 'inline-block', marginTop: 8 }}
                    >
                      ↗ {p.url.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
