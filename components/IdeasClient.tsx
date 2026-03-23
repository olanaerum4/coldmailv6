'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type IdeaStatus = 'new' | 'doing' | 'done' | 'trashed'

interface Idea {
  id: string
  text: string
  project_id: string | null
  status: IdeaStatus
  created_at: string
}

const STATUS_TABS: { value: IdeaStatus | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'Alle', emoji: '📋' },
  { value: 'new', label: 'Nye', emoji: '💡' },
  { value: 'doing', label: 'Jobber med', emoji: '🔨' },
  { value: 'done', label: 'Ferdig', emoji: '✅' },
  { value: 'trashed', label: 'Skrot', emoji: '🗑' },
]

const STATUS_STYLE: Record<IdeaStatus, { bg: string; color: string }> = {
  new:     { bg: '#fef9c3', color: '#854d0e' },
  doing:   { bg: '#dbeafe', color: '#1e40af' },
  done:    { bg: '#d1fae5', color: '#065f46' },
  trashed: { bg: '#f1f5f9', color: '#94a3b8' },
}

export default function IdeasClient({ ideas: initial, projects }: { ideas: Idea[]; projects: any[] }) {
  const router = useRouter()
  const [ideas, setIdeas] = useState<Idea[]>(initial)
  const [text, setText] = useState('')
  const [projectId, setProjectId] = useState('')
  const [filter, setFilter] = useState<IdeaStatus | 'all'>('new')
  const [adding, setAdding] = useState(false)

  const filtered = ideas.filter(i => filter === 'all' || i.status === filter)

  async function handleAdd() {
    if (!text.trim()) return
    setAdding(true)
    const res = await fetch('/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim(), project_id: projectId || null }),
    })
    const idea = await res.json()
    setIdeas(prev => [idea, ...prev])
    setText('')
    setAdding(false)
  }

  async function updateStatus(id: string, status: IdeaStatus) {
    await fetch(`/api/ideas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  async function deleteIdea(id: string) {
    await fetch(`/api/ideas/${id}`, { method: 'DELETE' })
    setIdeas(prev => prev.filter(i => i.id !== id))
  }

  function getProjectName(id: string | null) {
    if (!id) return null
    return projects.find(p => p.id === id)
  }

  return (
    <div>
      {/* Quick capture – big and prominent */}
      <div
        className="rounded-2xl p-5 mb-6"
        style={{ background: '#fff', border: '2px solid var(--accent)', boxShadow: '0 4px 20px rgba(37,99,235,0.1)' }}
      >
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd()
          }}
          placeholder="Hva er idéen? Skriv og trykk ⌘+Enter..."
          rows={3}
          autoFocus
          style={{
            width: '100%', background: 'transparent', border: 'none', outline: 'none',
            fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--text)',
            resize: 'none', lineHeight: 1.6,
          }}
        />
        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)',
              background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 8,
              padding: '5px 10px', outline: 'none',
            }}
          >
            <option value="">Ikke tilknyttet prosjekt</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
            ))}
          </select>
          <div className="flex items-center gap-3">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)' }}>⌘+Enter</span>
            <button
              onClick={handleAdd}
              disabled={adding || !text.trim()}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
                background: text.trim() ? 'var(--accent)' : '#e2e8f0',
                color: text.trim() ? '#fff' : '#94a3b8',
                border: 'none', borderRadius: 10, padding: '8px 18px', cursor: text.trim() ? 'pointer' : 'default',
              }}
            >
              {adding ? '...' : '💡 Lagre idé'}
            </button>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_TABS.map(tab => {
          const count = tab.value === 'all' ? ideas.length : ideas.filter(i => i.status === tab.value).length
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
                padding: '5px 14px', borderRadius: 99, cursor: 'pointer',
                border: filter === tab.value ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                background: filter === tab.value ? '#eff6ff' : '#fff',
                color: filter === tab.value ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {tab.emoji} {tab.label} <span style={{ opacity: 0.6 }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Ideas list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl p-10 text-center" style={{ border: '2px dashed var(--border)', background: '#fff' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-faint)' }}>
              {filter === 'new' ? 'Ingen nye idéer – skriv en ovenfor!' : 'Ingen her'}
            </p>
          </div>
        ) : (
          filtered.map(idea => {
            const ss = STATUS_STYLE[idea.status]
            const proj = getProjectName(idea.project_id)
            return (
              <div
                key={idea.id}
                className="rounded-xl p-4"
                style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text)', flex: 1, margin: 0, lineHeight: 1.6 }}>
                    {idea.text}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: ss.bg, color: ss.color }}>
                      {STATUS_TABS.find(t => t.value === idea.status)?.emoji} {STATUS_TABS.find(t => t.value === idea.status)?.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    {proj && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)', background: '#f8fafc', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 6 }}>
                        {proj.emoji} {proj.name}
                      </span>
                    )}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)' }}>
                      {new Date(idea.created_at).toLocaleDateString('nb-NO')}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {(['new', 'doing', 'done', 'trashed'] as IdeaStatus[]).filter(s => s !== idea.status).map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(idea.id, s)}
                        style={{
                          fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                          padding: '3px 8px', borderRadius: 6, cursor: 'pointer',
                          border: '1px solid var(--border)', background: '#f8fafc',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {STATUS_TABS.find(t => t.value === s)?.emoji}
                      </button>
                    ))}
                    <button
                      onClick={() => deleteIdea(idea.id)}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '3px 8px', borderRadius: 6, cursor: 'pointer', border: '1px solid #fee2e2', background: '#fef2f2', color: '#dc2626' }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
