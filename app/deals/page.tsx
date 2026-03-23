import { supabaseAdmin } from '@/lib/supabase'
import DealsClient from '@/components/DealsClient'

export const revalidate = 0

async function getData() {
  const [{ data: deals }, { data: projects }] = await Promise.all([
    supabaseAdmin.from('deals').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('founder_projects').select('id, name, emoji').order('sort_order'),
  ])
  return { deals: deals ?? [], projects: projects ?? [] }
}

export default async function DealsPage() {
  const { deals, projects } = await getData()
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-mono font-bold" style={{ color: 'var(--text)' }}>💸 Deal Pipeline</h1>
        <p className="text-sm mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>Spor salgsmuligheter og pipeline-verdi</p>
      </div>
      <DealsClient deals={deals} projects={projects} />
    </div>
  )
}
