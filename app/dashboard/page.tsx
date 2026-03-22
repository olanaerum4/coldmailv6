import { supabaseAdmin } from '@/lib/supabase'
import { CampaignStats } from '@/types'
import { pct, statusColor } from '@/lib/utils'
import Link from 'next/link'

async function getStats(): Promise<CampaignStats[]> {
  const { data } = await supabaseAdmin
    .from('campaign_stats')
    .select('*')
    .order('emails_sent', { ascending: false })
  return data ?? []
}

export default async function DashboardPage() {
  const stats = await getStats()

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

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-mono font-bold text-zinc-100">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1 font-mono">Overordnet ytelse på tvers av kampanjer</p>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-5 gap-4 mb-10">
        {[
          { label: 'Leads', value: totals.leads, sub: null },
          { label: 'Sendt', value: totals.sent, sub: null },
          { label: 'Åpnet', value: totals.opened, sub: pct(totals.opened, totals.sent) },
          { label: 'Klikket', value: totals.clicked, sub: pct(totals.clicked, totals.sent) },
          { label: 'Svart', value: totals.replied, sub: pct(totals.replied, totals.sent) },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">{label}</p>
            <p className="text-3xl font-mono font-bold text-zinc-100">{value.toLocaleString()}</p>
            {sub && <p className="text-sm font-mono text-cyan-400 mt-1">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Per-campaign breakdown */}
      <h2 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest mb-4">Per kampanje</h2>
      {stats.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-lg p-12 text-center">
          <p className="text-zinc-600 font-mono text-sm">Ingen data ennå</p>
          <Link href="/campaigns/new" className="mt-3 inline-block text-cyan-400 text-sm hover:underline font-mono">
            Opprett en kampanje →
          </Link>
        </div>
      ) : (
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="bg-zinc-900 border-b border-zinc-800">
                {['Kampanje', 'Status', 'Leads', 'Sendt', 'Åpnet', 'Klikket', 'Svart'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => (
                <tr key={s.campaign_id} className={`border-b border-zinc-800/50 ${i % 2 === 0 ? 'bg-zinc-950' : 'bg-zinc-900/30'}`}>
                  <td className="px-4 py-3">
                    <Link href={`/campaigns/${s.campaign_id}`} className="text-zinc-200 hover:text-cyan-400 transition-colors">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${statusColor(s.status)}`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{s.total_leads}</td>
                  <td className="px-4 py-3 text-zinc-400">{s.emails_sent}</td>
                  <td className="px-4 py-3">
                    <span className="text-zinc-400">{s.emails_opened}</span>
                    <span className="text-zinc-600 ml-1 text-xs">{pct(s.emails_opened, s.emails_sent)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-zinc-400">{s.emails_clicked}</span>
                    <span className="text-zinc-600 ml-1 text-xs">{pct(s.emails_clicked, s.emails_sent)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-emerald-400">{s.emails_replied}</span>
                    <span className="text-zinc-600 ml-1 text-xs">{pct(s.emails_replied, s.emails_sent)}</span>
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
