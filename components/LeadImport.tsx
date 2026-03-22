'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  campaignId: string
}

export default function LeadImport({ campaignId }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState({ email: '', name: '', company: '', phone: '' })
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [rawRows, setRawRows] = useState<string[][]>([])

  function parseCSV(text: string): string[][] {
    return text
      .split('\n')
      .map((line) => line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '')))
      .filter((row) => row.some((cell) => cell.length > 0))
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const rows = parseCSV(text)
      if (rows.length < 2) return
      const hdrs = rows[0]
      setHeaders(hdrs)
      setRawRows(rows.slice(1))
      const previewRows = rows.slice(1, 4).map((row) =>
        Object.fromEntries(hdrs.map((h, i) => [h, row[i] ?? '']))
      )
      setPreview(previewRows)
      // Auto-map common column names
      const lower = hdrs.map((h) => h.toLowerCase())
      setMapping({
        email: hdrs[lower.findIndex((h) => h.includes('email') || h === 'e-post')] ?? '',
        name: hdrs[lower.findIndex((h) => h.includes('name') || h.includes('navn'))] ?? '',
        company: hdrs[lower.findIndex((h) => h.includes('company') || h.includes('selskap') || h.includes('firma'))] ?? '',
        phone: hdrs[lower.findIndex((h) => h.includes('phone') || h.includes('tlf') || h.includes('mobil'))] ?? '',
      })
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!mapping.email) { alert('Du må velge hvilken kolonne som er e-post'); return }
    setImporting(true)
    setResult(null)
    const emailIdx = headers.indexOf(mapping.email)
    const nameIdx = mapping.name ? headers.indexOf(mapping.name) : -1
    const companyIdx = mapping.company ? headers.indexOf(mapping.company) : -1
    const phoneIdx = mapping.phone ? headers.indexOf(mapping.phone) : -1

    const leads = rawRows
      .filter((row) => row[emailIdx]?.includes('@'))
      .map((row) => ({
        email: row[emailIdx].toLowerCase(),
        name: nameIdx >= 0 ? row[nameIdx] : null,
        company: companyIdx >= 0 ? row[companyIdx] : null,
        phone: phoneIdx >= 0 ? row[phoneIdx] : null,
      }))

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/leads/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      setPreview([])
      setRawRows([])
      setHeaders([])
      if (fileRef.current) fileRef.current.value = ''
      router.refresh()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      {result ? (
        <div className="flex items-center gap-4">
          <span className="text-emerald-400 font-mono text-sm">✓ Importert {result.imported} leads</span>
          {result.skipped > 0 && (
            <span className="text-zinc-500 font-mono text-sm">({result.skipped} duplikater hoppet over)</span>
          )}
          <button onClick={() => setResult(null)} className="text-xs text-zinc-600 hover:text-zinc-400 font-mono ml-auto">
            Importer mer
          </button>
        </div>
      ) : preview.length > 0 ? (
        <div>
          <p className="text-xs text-zinc-400 font-mono mb-4">{rawRows.length} rader funnet. Velg kolonnemapping:</p>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {(['email', 'name', 'company', 'phone'] as const).map((field) => (
              <div key={field}>
                <label className="block text-xs text-zinc-500 font-mono mb-1">{field}</label>
                <select
                  value={mapping[field]}
                  onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">— ignorer</option>
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          {/* Preview */}
          <div className="border border-zinc-800 rounded overflow-hidden mb-4">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="bg-zinc-800">
                  {headers.map((h) => <th key={h} className="px-3 py-2 text-left text-zinc-400">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t border-zinc-800">
                    {headers.map((h) => <td key={h} className="px-3 py-2 text-zinc-300">{row[h]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-4 py-2 bg-cyan-500 text-black text-xs font-mono font-bold rounded hover:bg-cyan-400 transition-colors disabled:opacity-50"
            >
              {importing ? 'Importerer...' : `Importer ${rawRows.length} leads`}
            </button>
            <button
              onClick={() => { setPreview([]); setRawRows([]); setHeaders([]); if (fileRef.current) fileRef.current.value = '' }}
              className="px-4 py-2 bg-zinc-800 text-zinc-400 text-xs font-mono rounded hover:bg-zinc-700 transition-colors"
            >
              Avbryt
            </button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center border border-dashed border-zinc-700 rounded-lg p-8 cursor-pointer hover:border-zinc-500 transition-colors">
          <span className="text-2xl mb-2">⇪</span>
          <span className="text-sm text-zinc-300 font-mono">Last opp CSV-fil</span>
          <span className="text-xs text-zinc-600 font-mono mt-1">email, name, company, phone</span>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        </label>
      )}
    </div>
  )
}
