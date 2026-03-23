'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Source = 'google-maps' | 'gule-sider' | 'email-crawler'

interface Lead {
  name: string
  email?: string
  primary_email?: string
  emails?: string[]
  phone?: string
  website?: string
  address?: string
  category?: string
  rating?: number
  place_id?: string
  selected?: boolean
}

const inputStyle = {
  background: '#f8fafc',
  border: '1px solid var(--border-strong)',
  borderRadius: '8px',
  padding: '9px 12px',
  fontSize: '13px',
  fontFamily: 'var(--font-mono)',
  color: 'var(--text)',
  outline: 'none',
  width: '100%',
} as React.CSSProperties

const btnPrimary = {
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '10px 20px',
  fontSize: '13px',
  fontFamily: 'var(--font-mono)',
  fontWeight: '700',
  cursor: 'pointer',
} as React.CSSProperties

export default function ScraperClient({ campaigns }: { campaigns: any[] }) {
  const router = useRouter()
  const [source, setSource] = useState<Source>('google-maps')
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('Norge')
  const [maxResults, setMaxResults] = useState('20')
  const [crawlWebsites, setCrawlWebsites] = useState(true)
  const [loading, setLoading] = useState(false)
  const [crawling, setCrawling] = useState(false)
  const [results, setResults] = useState<Lead[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? '')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null)

  const sources = [
    { id: 'google-maps' as Source, label: 'Google Maps', icon: '🗺', desc: 'Lokale bedrifter via Google Places API' },
    { id: 'gule-sider' as Source, label: 'Gule Sider', icon: '📒', desc: 'Norske bedrifter fra gulesider.no' },
    { id: 'email-crawler' as Source, label: 'E-post crawler', icon: '🕷', desc: 'Finn e-post på eksisterende nettsider' },
  ]

  async function handleSearch() {
    if (!query) return
    setLoading(true)
    setResults([])
    setSelectedIds(new Set())
    setImportResult(null)

    try {
      let data: any

      if (source === 'email-crawler') {
        // For email crawler: parse textarea as URLs
        const websites = query.split('\n')
          .map(line => line.trim())
          .filter(Boolean)
          .map(url => ({ name: url, website: url }))

        const res = await fetch('/api/scrape/email-crawler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websites }),
        })
        data = await res.json()
        setResults(data.results ?? [])
      } else {
        const endpoint = source === 'google-maps' ? '/api/scrape/google-maps' : '/api/scrape/gule-sider'
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, location, max: parseInt(maxResults) }),
        })
        data = await res.json()

        if (!res.ok) {
          alert(data.error)
          setLoading(false)
          return
        }

        let leads: Lead[] = data.results ?? []
        setResults(leads)

        // Auto-crawl websites for emails if enabled
        if (crawlWebsites && leads.some(l => l.website)) {
          setLoading(false)
          setCrawling(true)
          const withWebsites = leads.filter(l => l.website)
          const crawlRes = await fetch('/api/scrape/email-crawler', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ websites: withWebsites }),
          })
          const crawlData = await crawlRes.json()

          // Merge emails back
          const emailMap: Record<string, string> = {}
          for (const r of crawlData.results ?? []) {
            if (r.website && r.primary_email) emailMap[r.website] = r.primary_email
          }
          leads = leads.map(l => ({
            ...l,
            primary_email: l.website ? (emailMap[l.website] ?? l.primary_email) : l.primary_email,
          }))
          setResults(leads)
          setCrawling(false)
          return
        }
      }
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
      setCrawling(false)
    }
  }

  function toggleSelect(i: number) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function toggleAll() {
    if (selectedIds.size === results.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(results.map((_, i) => i)))
    }
  }

  async function handleImport() {
    if (!campaignId || selectedIds.size === 0) return
    setImporting(true)

    const leads = Array.from(selectedIds).map(i => {
      const r = results[i]
      return {
        email: r.primary_email ?? r.email ?? '',
        name: r.name,
        company: r.name,
        phone: r.phone ?? null,
      }
    }).filter(l => l.email.includes('@'))

    if (!leads.length) {
      alert('Ingen av de valgte leadene har e-postadresse. Kjør e-post crawler først.')
      setImporting(false)
      return
    }

    const res = await fetch(`/api/campaigns/${campaignId}/leads/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads }),
    })
    const data = await res.json()
    setImportResult(data)
    setImporting(false)
    router.refresh()
  }

  const hasEmail = (l: Lead) => !!(l.primary_email ?? l.email ?? l.emails?.[0])
  const emailCount = results.filter(hasEmail).length

  return (
    <div>
      {/* Source tabs */}
      <div className="flex gap-3 mb-6">
        {sources.map(s => (
          <button
            key={s.id}
            onClick={() => { setSource(s.id); setResults([]); setSelectedIds(new Set()) }}
            className="flex-1 rounded-xl p-4 text-left transition-all"
            style={{
              background: source === s.id ? '#eff6ff' : '#fff',
              border: `1.5px solid ${source === s.id ? 'var(--accent)' : 'var(--border)'}`,
              boxShadow: source === s.id ? '0 0 0 3px rgba(37,99,235,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
              cursor: 'pointer',
            }}
          >
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="font-mono font-bold text-sm" style={{ color: source === s.id ? 'var(--accent)' : 'var(--text)' }}>
              {s.label}
            </div>
            <div className="font-mono text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{s.desc}</div>
          </button>
        ))}
      </div>

      {/* Search form */}
      <div className="rounded-xl p-5 mb-6" style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {source === 'email-crawler' ? (
          <div>
            <label className="block text-xs font-mono font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Nettsider (én per linje)
            </label>
            <textarea
              rows={5}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="https://www.rorlegger-oslo.no&#10;https://www.elektrofirma.no&#10;firma.no"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        ) : (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-mono font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                {source === 'google-maps' ? 'Søkeord (bransje)' : 'Søkeord'}
              </label>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder={source === 'google-maps' ? 'rørlegger, elektriker, frisør...' : 'rørlegger'}
                style={inputStyle}
              />
            </div>
            <div className="w-44">
              <label className="block text-xs font-mono font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Sted
              </label>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Oslo, Bergen..."
                style={inputStyle}
              />
            </div>
            <div className="w-24">
              <label className="block text-xs font-mono font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Maks
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={maxResults}
                onChange={e => setMaxResults(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            {source !== 'email-crawler' && (
              <label className="flex items-center gap-2 text-xs font-mono cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={crawlWebsites}
                  onChange={e => setCrawlWebsites(e.target.checked)}
                  className="accent-blue-600"
                />
                Auto-hent e-poster fra nettsider
              </label>
            )}
            {source === 'google-maps' && (
              <span className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>
                Krever GOOGLE_PLACES_API_KEY
              </span>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || crawling || !query}
            style={{ ...btnPrimary, opacity: loading || crawling || !query ? 0.5 : 1 }}
          >
            {loading ? 'Søker...' : crawling ? 'Henter e-poster...' : '🔍 Søk'}
          </button>
        </div>
      </div>

      {/* Status bar during crawl */}
      {crawling && (
        <div className="rounded-xl p-4 mb-4 flex items-center gap-3" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
          <span className="text-sm font-mono" style={{ color: '#1e40af' }}>
            Crawler nettsider etter e-postadresser... ({results.filter(hasEmail).length}/{results.length} funnet)
          </span>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          {/* Summary + import bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-mono font-semibold" style={{ color: 'var(--text)' }}>
                {results.length} resultater
              </span>
              <span className="text-sm font-mono" style={{ color: emailCount > 0 ? '#059669' : 'var(--text-faint)' }}>
                {emailCount} med e-post
              </span>
              {selectedIds.size > 0 && (
                <span className="text-sm font-mono font-semibold" style={{ color: 'var(--accent)' }}>
                  {selectedIds.size} valgt
                </span>
              )}
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3">
                {importResult ? (
                  <span className="text-sm font-mono font-semibold" style={{ color: '#059669' }}>
                    ✓ {importResult.imported} importert{importResult.skipped > 0 ? `, ${importResult.skipped} duplikat` : ''}
                  </span>
                ) : (
                  <>
                    <select
                      value={campaignId}
                      onChange={e => setCampaignId(e.target.value)}
                      className="font-mono text-sm px-3 py-2 rounded-lg"
                      style={{ border: '1px solid var(--border-strong)', background: '#f8fafc', color: 'var(--text)', outline: 'none' }}
                    >
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleImport}
                      disabled={importing}
                      style={{ ...btnPrimary, opacity: importing ? 0.5 : 1, padding: '8px 16px' }}
                    >
                      {importing ? 'Importerer...' : `Importer ${selectedIds.size} leads →`}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <table className="w-full text-sm font-mono">
              <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={selectedIds.size === results.length && results.length > 0} onChange={toggleAll} className="accent-blue-600" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Navn</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>E-post</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Telefon</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Sted / Nettside</th>
                  {source === 'google-maps' && (
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>⭐</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {results.map((lead, i) => {
                  const email = lead.primary_email ?? lead.email ?? lead.emails?.[0]
                  return (
                    <tr
                      key={i}
                      onClick={() => toggleSelect(i)}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: selectedIds.has(i) ? '#eff6ff' : i % 2 === 0 ? '#fff' : 'var(--bg)',
                        cursor: 'pointer',
                      }}
                    >
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedIds.has(i)} onChange={() => toggleSelect(i)} onClick={e => e.stopPropagation()} className="accent-blue-600" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold" style={{ color: 'var(--text)' }}>{lead.name}</span>
                        {lead.category && <span className="block text-xs" style={{ color: 'var(--text-faint)' }}>{lead.category}</span>}
                      </td>
                      <td className="px-4 py-3">
                        {email ? (
                          <span className="font-semibold" style={{ color: '#059669' }}>{email}</span>
                        ) : (
                          <span style={{ color: 'var(--text-faint)' }}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{lead.phone ?? '—'}</td>
                      <td className="px-4 py-3">
                        {lead.address && <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{lead.address}</span>}
                        {lead.website && (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-xs hover:underline"
                            style={{ color: 'var(--accent)' }}
                          >
                            {lead.website.replace(/^https?:\/\//, '').split('/')[0]}
                          </a>
                        )}
                      </td>
                      {source === 'google-maps' && (
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                          {lead.rating ? `${lead.rating}★` : '—'}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs font-mono mt-2" style={{ color: 'var(--text-faint)' }}>
            Klikk rad for å velge. Velg leads med e-post og importer til kampanje.
          </p>
        </div>
      )}

      {/* Google Maps API key info */}
      {source === 'google-maps' && results.length === 0 && !loading && (
        <div className="rounded-xl p-5 mt-4" style={{ background: '#fafafa', border: '1px solid var(--border)' }}>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
            Google Places API-nøkkel
          </h3>
          <ol className="text-xs font-mono space-y-1" style={{ color: 'var(--text-muted)' }}>
            <li>1. Gå til <a href="https://console.cloud.google.com" target="_blank" className="underline" style={{ color: 'var(--accent)' }}>console.cloud.google.com</a></li>
            <li>2. Aktiver <strong>Places API</strong></li>
            <li>3. Opprett en API-nøkkel</li>
            <li>4. Legg til i Vercel: <code style={{ background: '#e2e8f0', padding: '0 4px', borderRadius: '3px' }}>GOOGLE_PLACES_API_KEY=din_nøkkel</code></li>
          </ol>
          <p className="text-xs font-mono mt-2" style={{ color: 'var(--text-faint)' }}>
            Gratis opp til $200/mnd (~10 000 søk). Gule Sider fungerer uten nøkkel.
          </p>
        </div>
      )}
    </div>
  )
}
