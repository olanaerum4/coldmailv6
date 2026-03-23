import { supabaseAdmin } from '@/lib/supabase'
import FounderDashboard from '@/components/FounderDashboard'

export const revalidate = 0

async function getData() {
  const [{ data: projects }, { data: todos }, { data: snapshots }] = await Promise.all([
    supabaseAdmin.from('founder_projects').select('*').order('sort_order'),
    supabaseAdmin.from('founder_todos').select('*').order('created_at'),
    supabaseAdmin
      .from('mrr_snapshots')
      .select('*')
      .order('recorded_at', { ascending: true })
      .gte('recorded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
  ])
  return { projects: projects ?? [], todos: todos ?? [], snapshots: snapshots ?? [] }
}

export default async function FounderPage() {
  const { projects, todos, snapshots } = await getData()
  return <FounderDashboard initialProjects={projects} initialTodos={todos} initialSnapshots={snapshots} />
}
