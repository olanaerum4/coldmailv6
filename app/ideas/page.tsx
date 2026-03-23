import { supabaseAdmin } from '@/lib/supabase'
import IdeasClient from '@/components/IdeasClient'

export const revalidate = 0

async function getData() {
  const [{ data: ideas }, { data: projects }] = await Promise.all([
    supabaseAdmin.from('ideas').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('founder_projects').select('id, name, emoji').order('sort_order'),
  ])
  return { ideas: ideas ?? [], projects: projects ?? [] }
}

export default async function IdeasPage() {
  const { ideas, projects } = await getData()
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-mono font-bold" style={{ color: 'var(--text)' }}>Idéer 💡</h1>
        <p className="text-sm mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
          Fang idéer raskt – fra mobil eller desktop
        </p>
      </div>
      <IdeasClient ideas={ideas} projects={projects} />
    </div>
  )
}
