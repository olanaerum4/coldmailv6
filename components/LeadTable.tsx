'use client'
import { useState } from 'react'
import { Lead, LeadStatus } from '@/types'
import { statusColor, statusLabel } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Props {
  leads: Lead[]
}

const STATUS_TABS: { label: string; value: LeadStatus | 'all' }[] = [
  { label: 'Alle', value: 'all' },
  { label: 'Ikke kontaktet', value: 'pending' },
  { label: 'Aktiv', value: 'active' },
  { label: 'Svart', value: 'replied' },
  { label: 'Avvist', value: 'bounced' },
  { label: 'Avmeldt', value: 'unsubscribed' },
]

export default function LeadTable({ leads }: Props) {
  const router = useRouter()
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  const filtered = leads.filter((l) => {
    if (filter !== 'all' && l.status !== filter) return false
    if (search && !l.email.toLowerCase().includes(search.toLowerCase()) &&
        !(l.name?.toLowerCase().includes(search.toLowerCase())) &&
        !(l.company?.toLowerCase().includes(search.toLowerCase()))) return false
    return true
  })

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((l) => l.id)))
    }
  }

  async function handleDelete() {
    if (!selected.size) return
    setDeleting(true)
    const campaignId = leads[0]?.campaign_id
    await fetch(`/api/campaigns/${campaignId}/leads`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadIds: Array.from(selected) }),
    })
    setSelected(new Set())
    setDeleting(false)
    router.refresh()
  }

  if (leads.length === 0) {
    return (
      <div className="border border-dashed border-zinc-800 rounded-lg p-10 text-center">
        <p className="text-zinc-600 font-mono text-sm">Ingen leads. Importer en CSV-fil ovenfor.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-3 gap-4">
        {/* Status tabs */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map((tab) => {
            const count = tab.value === 'all' ? leads.length : leads.filter((l) => l.status === tab.value).length
            if (count === 0 && tab.value !== 'all') return null
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                  filter === tab.value
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                }`}
              >
                {tab.label} <span className="opacity-60">{count}</span>
              </button>
            )
          })}
        </div>

        {/* Search + bulk */}
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 bg-red-900/50 border border-red-800 text-red-300 text-xs font-mono rounded hover:bg-red-900 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Sletter...' : `Slett ${selected.size} valgte`}
            </button>
          )}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søk..."
            className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-500 placeholder:text-zinc-600 w-40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="bg-zinc-900 border-b border-zinc-800">
              <th className="px-4 py-3 text-left w-8">
                <input
                  type="checkbox"
                  checked={selected.size > 0 && selected.size === filtered.length}
                  onChange={toggleAll}
                  className="accent-cyan-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs text-zinc-400">E-post</th>
              <th className="px-4 py-3 text-left text-xs text-zinc-400">Navn</th>
              <th className="px-4 py-3 text-left text-xs text-zinc-400">Selskap</th>
              <th className="px-4 py-3 text-left text-xs text-zinc-400">Steg</th>
              <th className="px-4 py-3 text-left text-xs text-zinc-400">Status</th>
              <th className="px-4 py-3 text-left text-xs text-zinc-400">Lagt til</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-600 text-xs font-mono">
                  Ingen leads matcher filteret
                </td>
              </tr>
            ) : (
              filtered.map((lead, i) => (
                <tr
                  key={lead.id}
                  className={`border-b border-zinc-800/50 ${i % 2 === 0 ? 'bg-zinc-950' : 'bg-zinc-900/30'} ${selected.has(lead.id) ? 'bg-cyan-950/20' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(lead.id)}
                      onChange={() => toggleSelect(lead.id)}
                      className="accent-cyan-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{lead.email}</td>
                  <td className="px-4 py-3 text-zinc-400">{lead.name ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-500">{lead.company ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-500">{lead.current_step}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${statusColor(lead.status)}`}>
                      {statusLabel(lead.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 text-xs">
                    {new Date(lead.created_at).toLocaleDateString('nb-NO')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {filtered.length > 0 && (
        <p className="text-xs text-zinc-600 font-mono mt-2">{filtered.length} av {leads.length} leads</p>
      )}
    </div>
  )
}
