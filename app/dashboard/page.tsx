import { supabaseAdmin } from '@/lib/supabase'
import { CampaignStats } from '@/types'
import { pct, statusColor, statusLabel } from '@/lib/utils'
import Link from 'next/link'

export const revalidate = 0

async function getStats(): Promise<CampaignStats[]> {
  const { data } = await supabaseAdmin
    .from('campaign_stats')
    .select('*')
    .order('emails_sent', { ascending: false })
  return data ?? []
}

async function getMailboxCount(): Promise<number> {
  const { count } = await supabaseAdmin
    .from('mailboxes')
    .select('id', { count: 'exact', head: true })
    .eq('active', true)
  return count ?? 0
}

export default async function DashboardPage() {
  const [stats, mailboxCount] = await Promise.all([getStats(), getMailboxCount()])

  const totals = stats.reduce(
    (acc, s) => ({
      leads: acc.leads + Number(s.total_leads),
      sent: acc.sent + Number(s.emails_sent),
      opened: acc.opened + Number(s.emails_opened),
      clicked: acc.clicked + Number(s.emails_clicked),
      replied: acc.replied + Number(s.emails_replied),
    }),
    { leads: 0, sent: 0, opened: 0, clicked: 0, replied: 0 }
  )

  const statCards = [
    { label: 'Leads totalt', value: totals.leads, sub: null, color: '#0f172a' },
    { label: 'E-poster sendt', value: totals.sent, sub: null, color: '#0f172a' },
    { label: 'Åpnet', value: totals.opened, sub: pct(totals.opened, totals.sent), color: '#2563eb' },
    { label: 'Klikket', value: totals.clicked, sub: pct(totals.clicked, totals.sent), color: '#7c3aed' },
    { label: 'Svart', value: totals.replied, sub: pct(totals.replied, totals.sent), color: '#059669' },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-mono font-bold" style={{ color: 'var(--text)' }}>Dashboard</h1>
          <p className="text-sm mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
            {mailboxCount} aktiv{mailboxCount === 1 ? '' : 'e'} mailboks{mailboxCount === 1 ? '' : 'er'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/mailboxes"
            className="px-4 py-2 text-sm font-mono font-semibold rounded-lg border transition-colors"
            style={{ borderColor: 'var(--border-strong)', color: 'var(--text-muted)', background: '#fff' }}
          >
            ✉ Mailbokser
          </Link>
          <Link
            href="/campaigns/new"
            className="px-4 py-2 text-sm font-mono font-bold rounded-lg text-white transition-colors"
            style={{ background: 'var(--accent)' }}
          >
            + Ny kampanje
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-5 gap-4 mb-10">
        {statCards.map(({ label, value, sub, color }) => (
          <div
            key={label}
            className="rounded-xl p-5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <p className="text-xs font-mono mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-3xl font-mono font-bold" style={{ color }}>{value.toLocaleString('nb-NO')}</p>
            {sub && <p className="text-sm font-mono mt-1 font-semibold" style={{ color: 'var(--accent)' }}>{sub}</p>}
          </div>
        ))}
      </div>

      {/* Campaigns table */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Per kampanje
        </h2>
      </div>

      {stats.length === 0 ? (
        <div
          className="rounded-xl p-16 text-center"
          style={{ border: '2px dashed var(--border)', background: 'var(--bg-card)' }}
        >
          <p className="font-mono text-sm" style={{ color: 'var(--text-faint)' }}>Ingen kampanjer ennå</p>
          <Link href="/campaigns/new" className="mt-3 inline-block text-sm font-mono font-semibold" style={{ color: 'var(--accent)' }}>
            Opprett din første kampanje →
          </Link>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <table className="w-full text-sm font-mono">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                {['Kampanje', 'Status', 'Leads', 'Sendt', 'Åpnet', 'Klikket', 'Svart'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => (
                <tr
                  key={s.campaign_id}
                  style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : 'var(--bg)' }}
                >
                  <td className="px-4 py-3">
                    <Link href={`/campaigns/${s.campaign_id}`} className="font-semibold hover:underline" style={{ color: 'var(--accent)' }}>
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{s.total_leads}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{s.emails_sent}</td>
                  <td className="px-4 py-3">
                    <span style={{ color: 'var(--text)' }}>{s.emails_opened}</span>
                    <span className="ml-1 text-xs" style={{ color: 'var(--text-faint)' }}>{pct(s.emails_opened, s.emails_sent)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ color: 'var(--text)' }}>{s.emails_clicked}</span>
                    <span className="ml-1 text-xs" style={{ color: 'var(--text-faint)' }}>{pct(s.emails_clicked, s.emails_sent)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold" style={{ color: '#059669' }}>{s.emails_replied}</span>
                    <span className="ml-1 text-xs" style={{ color: 'var(--text-faint)' }}>{pct(s.emails_replied, s.emails_sent)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    draft:     { bg: '#f1f5f9', color: '#64748b', label: 'Utkast' },
    active:    { bg: '#dbeafe', color: '#1d4ed8', label: 'Aktiv' },
    paused:    { bg: '#fef9c3', color: '#a16207', label: 'Pauset' },
    completed: { bg: '#d1fae5', color: '#065f46', label: 'Fullført' },
  }
  const s = map[status] ?? { bg: '#f1f5f9', color: '#64748b', label: status }
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}
