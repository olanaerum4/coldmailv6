import { supabaseAdmin } from '@/lib/supabase'
import FounderDashboard from '@/components/FounderDashboard'

export const revalidate = 0

async function getData() {
  const [{ data: projects }, { data: todos }] = await Promise.all([
    supabaseAdmin
      .from('founder_projects')
      .select('*')
      .order('sort_order'),
    supabaseAdmin
      .from('founder_todos')
      .select('*')
      .order('created_at'),
  ])
  return { projects: projects ?? [], todos: todos ?? [] }
}

export default async function FounderPage() {
  const { projects, todos } = await getData()
  return <FounderDashboard initialProjects={projects} initialTodos={todos} />
}
