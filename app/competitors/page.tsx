import { supabaseAdmin } from '@/lib/supabase'
import CompetitorClient from '@/components/CompetitorClient'

export const revalidate = 0

async function getData() {
  const [{ data: competitors }, { data: changes }, { data: projects }] = await Promise.all([
    supabaseAdmin.from('competitors').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('competitor_changes').select('*').order('detected_at', { ascending: false }).limit(20),
    supabaseAdmin.from('founder_projects').select('id,name,emoji').order('sort_order'),
  ])
  return { competitors: competitors ?? [], changes: changes ?? [], projects: projects ?? [] }
}

export default async function CompetitorPage() {
  const data = await getData()
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-mono font-bold" style={{ color: 'var(--text)' }}>📰 Konkurrent-radar</h1>
        <p className="text-sm mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>Overvåk konkurrenters nettsider og få varsel ved endringer</p>
      </div>
      <CompetitorClient {...data} />
    </div>
  )
}
