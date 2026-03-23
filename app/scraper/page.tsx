import ScraperClient from '@/components/ScraperClient'
import { supabaseAdmin } from '@/lib/supabase'

async function getCampaigns() {
  const { data } = await supabaseAdmin
    .from('campaigns')
    .select('id, name')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function ScraperPage() {
  const campaigns = await getCampaigns()
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-mono font-bold" style={{ color: 'var(--text)' }}>Lead Scraper</h1>
        <p className="text-sm mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
          Hent leads fra Google Maps, Gule Sider og nettsider
        </p>
      </div>
      <ScraperClient campaigns={campaigns} />
    </div>
  )
}
