import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { Campaign } from '@/types'
import { statusColor, statusLabel } from '@/lib/utils'

async function getCampaigns(): Promise<Campaign[]> {
  const { data } = await supabaseAdmin
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function CampaignsPage() {
  const campaigns = await getCampaigns()

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-mono font-bold text-zinc-100">Kampanjer</h1>
          <p className="text-sm text-zinc-500 mt-1">{campaigns.length} kampanjer totalt</p>
        </div>
        <Link
          href="/campaigns/new"
          className="px-4 py-2 bg-cyan-500 text-black text-sm font-mono font-bold rounded hover:bg-cyan-400 transition-colors"
        >
          + Ny kampanje
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-lg p-16 text-center">
          <p className="text-zinc-500 text-sm font-mono">Ingen kampanjer ennå</p>
          <Link href="/campaigns/new" className="mt-4 inline-block text-cyan-400 text-sm hover:underline">
            Opprett din første kampanje →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/campaigns/${c.id}`}
              className="flex items-center justify-between px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-600 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-mono text-sm font-medium text-zinc-100 group-hover:text-cyan-300 transition-colors">
                    {c.name}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{c.from_email}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className={`text-xs font-mono font-medium ${statusColor(c.status)}`}>
                  {statusLabel(c.status).toUpperCase()}
                </span>
                <span className="text-zinc-600 text-sm">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
