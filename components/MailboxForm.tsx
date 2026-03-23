'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FormData {
  name: string
  email: string
  smtp_host: string
  smtp_port: string
  smtp_user: string
  smtp_password: string
  daily_limit: string
  interval_minutes: string
}

const PRESETS: Record<string, Partial<FormData>> = {
  gmail: { smtp_host: 'smtp.gmail.com', smtp_port: '587' },
  outlook: { smtp_host: 'smtp.office365.com', smtp_port: '587' },
  yahoo: { smtp_host: 'smtp.mail.yahoo.com', smtp_port: '587' },
  sendgrid: { smtp_host: 'smtp.sendgrid.net', smtp_port: '587' },
  custom: {},
}

const inputStyle = {
  width: '100%',
  background: '#fff',
  border: '1px solid var(--border-strong)',
  borderRadius: '8px',
  padding: '10px 12px',
  fontSize: '14px',
  fontFamily: 'var(--font-mono)',
  color: 'var(--text)',
  outline: 'none',
} as React.CSSProperties

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '600',
  color: 'var(--text-muted)',
  marginBottom: '6px',
  fontFamily: 'var(--font-mono)',
} as React.CSSProperties

export default function MailboxForm({ mailbox }: { mailbox?: any }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [preset, setPreset] = useState('custom')
  const [form, setForm] = useState<FormData>({
    name: mailbox?.name ?? '',
    email: mailbox?.email ?? '',
    smtp_host: mailbox?.smtp_host ?? '',
    smtp_port: mailbox?.smtp_port?.toString() ?? '587',
    smtp_user: mailbox?.smtp_user ?? '',
    smtp_password: mailbox?.smtp_password ?? '',
    daily_limit: mailbox?.daily_limit?.toString() ?? '20',
    interval_minutes: mailbox?.interval_minutes?.toString() ?? '5',
  })

  function applyPreset(key: string) {
    setPreset(key)
    const p = PRESETS[key]
    setForm((f) => ({ ...f, ...p }))
  }

  function update(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/mailboxes/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtp_host: form.smtp_host,
          smtp_port: parseInt(form.smtp_port),
          smtp_user: form.smtp_user,
          smtp_password: form.smtp_password,
          email: form.email,
        }),
      })
      const data = await res.json()
      setTestResult({ ok: res.ok, message: data.message ?? data.error })
    } catch (e: any) {
      setTestResult({ ok: false, message: e.message })
    } finally {
      setTesting(false)
    }
  }

  async function handleSave() {
    if (!form.name || !form.email || !form.smtp_host || !form.smtp_user || !form.smtp_password) {
      alert('Fyll ut alle påkrevde felt')
      return
    }
    setSaving(true)
    try {
      const url = mailbox ? `/api/mailboxes/${mailbox.id}` : '/api/mailboxes'
      const method = mailbox ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          smtp_port: parseInt(form.smtp_port),
          daily_limit: parseInt(form.daily_limit),
          interval_minutes: parseInt(form.interval_minutes),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push('/mailboxes')
      router.refresh()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* SMTP presets */}
      <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <label style={labelStyle}>Leverandør</label>
        <div className="flex gap-2 flex-wrap">
          {Object.keys(PRESETS).map((key) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-colors capitalize"
              style={{
                background: preset === key ? '#eff6ff' : '#f8fafc',
                borderColor: preset === key ? 'var(--accent)' : 'var(--border)',
                color: preset === key ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {key === 'custom' ? 'Egendefinert' : key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-xs mt-2 font-mono" style={{ color: 'var(--text-faint)' }}>
          Gmail: bruk App Password (ikke vanlig passord). Outlook: bruk SMTP auth app password.
        </p>
      </div>

      {/* Connection details */}
      <div className="rounded-xl p-5 space-y-4" style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <h2 className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Tilkoblingsdetaljer</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Navn (internt)</label>
            <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Min Gmail-konto" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Avsender-epost</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="deg@gmail.com" style={inputStyle} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label style={labelStyle}>SMTP-server</label>
            <input value={form.smtp_host} onChange={(e) => update('smtp_host', e.target.value)} placeholder="smtp.gmail.com" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Port</label>
            <input type="number" value={form.smtp_port} onChange={(e) => update('smtp_port', e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>SMTP-brukernavn</label>
            <input value={form.smtp_user} onChange={(e) => update('smtp_user', e.target.value)} placeholder="deg@gmail.com" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Passord / App Password</label>
            <input type="password" value={form.smtp_password} onChange={(e) => update('smtp_password', e.target.value)} placeholder="••••••••••••" style={inputStyle} />
          </div>
        </div>

        {/* Test connection */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleTest}
            disabled={testing || !form.smtp_host || !form.smtp_user || !form.smtp_password}
            className="px-4 py-2 text-sm font-mono font-semibold rounded-lg border transition-colors disabled:opacity-40"
            style={{ borderColor: 'var(--border-strong)', color: 'var(--text-muted)', background: '#f8fafc' }}
          >
            {testing ? 'Tester...' : '⚡ Test tilkobling'}
          </button>
          {testResult && (
            <span className="text-sm font-mono font-semibold" style={{ color: testResult.ok ? '#059669' : '#dc2626' }}>
              {testResult.ok ? '✓' : '✗'} {testResult.message}
            </span>
          )}
        </div>
      </div>

      {/* Sending limits */}
      <div className="rounded-xl p-5 space-y-4" style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <h2 className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Sending-limiter</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Maks e-poster per dag</label>
            <input type="number" min={1} max={500} value={form.daily_limit} onChange={(e) => update('daily_limit', e.target.value)} style={inputStyle} />
            <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-faint)' }}>
              Gmail gratis: ~500/dag. G Suite: ~2000/dag.
            </p>
          </div>
          <div>
            <label style={labelStyle}>Minimum minutter mellom sends</label>
            <input type="number" min={1} max={60} value={form.interval_minutes} onChange={(e) => update('interval_minutes', e.target.value)} style={inputStyle} />
            <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-faint)' }}>
              Anbefalt: 3–10 min for å unngå spam-filtre.
            </p>
          </div>
        </div>

        {/* Visual preview */}
        <div className="rounded-lg p-3" style={{ background: '#f8fafc', border: '1px solid var(--border)' }}>
          <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            📊 Med disse innstillingene sender du maks{' '}
            <strong style={{ color: 'var(--text)' }}>{form.daily_limit} e-poster/dag</strong>
            {' '}fordelt med{' '}
            <strong style={{ color: 'var(--text)' }}>{form.interval_minutes} min mellomrom</strong>
            {' '}— tilsvarer ca.{' '}
            <strong style={{ color: 'var(--accent)' }}>
              {Math.floor(parseInt(form.daily_limit || '0') / Math.max(1, Math.floor(8 * 60 / parseInt(form.interval_minutes || '1'))))} sekvenser/time
            </strong>
            {' '}over en 8-timers dag.
          </p>
        </div>
      </div>

      {/* Save */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 text-sm font-mono font-bold rounded-lg text-white transition-colors disabled:opacity-50"
          style={{ background: 'var(--accent)' }}
        >
          {saving ? 'Lagrer...' : mailbox ? 'Oppdater mailboks' : 'Lagre mailboks'}
        </button>
      </div>
    </div>
  )
}
