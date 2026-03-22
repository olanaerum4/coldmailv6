import { supabaseAdmin } from '@/lib/supabase'
import { Lead, Sequence } from '@/types'
import { notFound } from 'next/navigation'
import LeadImport from '@/components/LeadImport'
import LeadTable from '@/components/LeadTable'
import CampaignStatusToggle from '@/components/CampaignStatusToggle'
import DeleteCampaignButton from '@/components/DeleteCampaignButton'
import Link from 'next/link'
import { statusColor, statusLabel } from '@/lib/utils'

export const revalidate = 0

async function getData(id: string) {
  const [{ data: campaign }, { data: leads }, { data: sequences }] = await Promise.all([
    supabaseAdmin.from('campaigns').select('*').eq('id', id).single(),
    supabaseAdmin.from('leads').select('*').eq('campaign_id', id).order('created_at', { ascending: false }),
    supabaseAdmin.from('sequences').select('*').eq('campaign_id', id).order('step_number'),
  ])
  return { campaign, leads: leads ?? [], sequences: sequences ?? [] }
}

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const { campaign, leads, sequences } = await getData(params.id)
  if (!campaign) notFound()

  const statusCounts = leads.reduce((acc: Record<string, number>, l: Lead) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/campaigns" className="text-zinc-600 text-sm hover:text-zinc-400 font-mono block mb-2">
            ← Kampanjer
          </Link>
          <h1 className="text-2xl font-mono font-bold text-zinc-100">{campaign.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-zinc-500 font-mono">
              {campaign.from_name} &lt;{campaign.from_email}&gt;
            </span>
            <span className={`text-xs font-mono font-bold ${statusColor(campaign.status)}`}>
              {statusLabel(campaign.status).toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/campaigns/${campaign.id}/edit`}
            className="px-4 py-2 bg-zinc-800 text-zinc-300 text-sm font-mono rounded hover:bg-zinc-700 transition-colors"
          >
            Rediger
          </Link>
          <CampaignStatusToggle campaign={campaign} />
          <DeleteCampaignButton campaignId={campaign.id} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        {[
          { label: 'Totalt', value: leads.length, color: 'text-zinc-100' },
          { label: 'Ikke kontaktet', value: statusCounts.pending ?? 0, color: 'text-zinc-400' },
          { label: 'Aktiv sekvens', value: statusCounts.active ?? 0, color: 'text-blue-400' },
          { label: 'Svart', value: statusCounts.replied ?? 0, color: 'text-emerald-400' },
          { label: 'Avvist', value: statusCounts.bounced ?? 0, color: 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <p className="text-xs text-zinc-500 font-mono mb-1">{label}</p>
            <p className={`text-2xl font-mono font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Sequences */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">
            Sekvens ({sequences.length} steg)
          </h2>
          <Link
            href={`/campaigns/${campaign.id}/edit`}
            className="text-xs font-mono text-cyan-500 hover:text-cyan-400 transition-colors"
          >
            Rediger sekvens →
          </Link>
        </div>
        <div className="flex gap-2 flex-wrap">
          {sequences.length === 0 ? (
            <p className="text-xs text-zinc-600 font-mono">Ingen steg enda</p>
          ) : (
            sequences.map((s: Sequence) => (
              <div
                key={s.id}
                className="bg-zinc-900 border border-zinc-800 rounded px-4 py-2.5 flex items-center gap-3"
              >
                <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-xs font-mono text-cyan-400">
                  {s.step_number}
                </span>
                <div>
                  <p className="text-xs font-mono text-zinc-200">{s.subject}</p>
                  <p className="text-xs text-zinc-600 font-mono">
                    {s.delay_days === 0 ? 'Dag 0' : `+${s.delay_days} dag${s.delay_days === 1 ? '' : 'er'}`}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lead import */}
      <div className="mb-8">
        <h2 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest mb-3">
          Importer leads (CSV)
        </h2>
        <LeadImport campaignId={campaign.id} />
      </div>

      {/* Leads table */}
      <div>
        <h2 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest mb-3">
          Leads ({leads.length})
        </h2>
        <LeadTable leads={leads} />
      </div>
    </div>
  )
}
