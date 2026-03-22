'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Step {
  step_number: number
  delay_days: number
  subject: string
  body: string
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    from_email: '',
    from_name: '',
  })
  const [steps, setSteps] = useState<Step[]>([
    { step_number: 1, delay_days: 0, subject: '', body: '' },
  ])

  function addStep() {
    setSteps((prev) => [
      ...prev,
      {
        step_number: prev.length + 1,
        delay_days: prev.length === 0 ? 0 : 3,
        subject: '',
        body: '',
      },
    ])
  }

  function removeStep(idx: number) {
    setSteps((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, step_number: i + 1 }))
    )
  }

  function updateStep(idx: number, field: keyof Step, value: string | number) {
    setSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    )
  }

  async function handleSave(status: 'draft' | 'active') {
    if (!form.name || !form.from_email || !form.from_name) {
      alert('Fyll ut navn, avsender-epost og avsendernavn')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status, sequences: steps }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/campaigns/${data.id}`)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-mono font-bold text-zinc-100">Ny kampanje</h1>
        <p className="text-sm text-zinc-500 mt-1">Sett opp kampanje og e-postsekvens</p>
      </div>

      {/* Basic info */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
        <h2 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest mb-4">Grunnoppsett</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-mono">Kampanjenavn</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Q1 2025 – SMB outreach"
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-cyan-500 placeholder:text-zinc-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-mono">Avsender-epost</label>
              <input
                type="email"
                value={form.from_email}
                onChange={(e) => setForm((f) => ({ ...f, from_email: e.target.value }))}
                placeholder="ola@selskap.no"
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-cyan-500 placeholder:text-zinc-600"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-mono">Avsendernavn</label>
              <input
                value={form.from_name}
                onChange={(e) => setForm((f) => ({ ...f, from_name: e.target.value }))}
                placeholder="Ola Nordmann"
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-cyan-500 placeholder:text-zinc-600"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sequence steps */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">Sekvens</h2>
          <button
            onClick={addStep}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            + Legg til steg
          </button>
        </div>
        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-xs font-mono text-cyan-400">
                    {step.step_number}
                  </span>
                  <span className="text-sm font-mono text-zinc-300">Steg {step.step_number}</span>
                  {idx === 0 && (
                    <span className="text-xs text-zinc-600 font-mono">— sendes umiddelbart</span>
                  )}
                </div>
                {steps.length > 1 && (
                  <button
                    onClick={() => removeStep(idx)}
                    className="text-xs text-zinc-600 hover:text-red-400 transition-colors font-mono"
                  >
                    × fjern
                  </button>
                )}
              </div>
              {idx > 0 && (
                <div className="mb-4">
                  <label className="block text-xs text-zinc-400 mb-1.5 font-mono">Forsinkelse (dager etter forrige steg)</label>
                  <input
                    type="number"
                    min={1}
                    value={step.delay_days}
                    onChange={(e) => updateStep(idx, 'delay_days', parseInt(e.target.value) || 1)}
                    className="w-24 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5 font-mono">Emnelinje</label>
                  <input
                    value={step.subject}
                    onChange={(e) => updateStep(idx, 'subject', e.target.value)}
                    placeholder={idx === 0 ? 'Rask henvendelse' : 'Oppfølging – {{name}}'}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-cyan-500 placeholder:text-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5 font-mono">Melding (HTML støttes)</label>
                  <textarea
                    rows={6}
                    value={step.body}
                    onChange={(e) => updateStep(idx, 'body', e.target.value)}
                    placeholder="Hei {{name}},&#10;&#10;Jeg så at {{company}} jobber med..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-cyan-500 placeholder:text-zinc-600 resize-y"
                  />
                  <p className="text-xs text-zinc-600 mt-1 font-mono">Bruk {'{{name}}'}, {'{{company}}'}, {'{{email}}'} som variabler</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => handleSave('draft')}
          disabled={saving}
          className="px-5 py-2.5 bg-zinc-800 text-zinc-100 text-sm font-mono rounded hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          Lagre som utkast
        </button>
        <button
          onClick={() => handleSave('active')}
          disabled={saving}
          className="px-5 py-2.5 bg-cyan-500 text-black text-sm font-mono font-bold rounded hover:bg-cyan-400 transition-colors disabled:opacity-50"
        >
          {saving ? 'Lagrer...' : 'Aktiver kampanje'}
        </button>
      </div>
    </div>
  )
}
