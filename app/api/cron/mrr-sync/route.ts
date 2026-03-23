import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { sendTelegram } from '@/lib/telegram'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, any> = {}

  try {
    // Get all projects with auto_sync enabled
    const { data: projects } = await supabaseAdmin
      .from('founder_projects')
      .select('*')
      .eq('auto_sync', true)

    for (const project of projects ?? []) {
      if (!project.supabase_url || !project.supabase_service_key) continue

      try {
        const extClient = createClient(project.supabase_url, project.supabase_service_key)

        let mrr = project.mrr
        let customers = project.customers

        // LokalProfil: count active paying businesses
        if (project.name.toLowerCase().includes('lokalprofil')) {
          const { count: custCount } = await extClient
            .from('businesses')
            .select('id', { count: 'exact', head: true })
            .eq('subscription_status', 'active')

          const { data: subs } = await extClient
            .from('businesses')
            .select('subscription_price')
            .eq('subscription_status', 'active')

          customers = custCount ?? 0
          mrr = (subs ?? []).reduce((sum: number, b: any) => sum + (b.subscription_price ?? 399), 0)
        }

        // Update project
        await supabaseAdmin
          .from('founder_projects')
          .update({ mrr, customers, updated_at: new Date().toISOString() })
          .eq('id', project.id)

        // Snapshot for graph
        await supabaseAdmin
          .from('mrr_snapshots')
          .upsert(
            { project_id: project.id, mrr, customers, recorded_at: new Date().toISOString().split('T')[0] },
            { onConflict: 'project_id,recorded_at' }
          )

        results[project.name] = { mrr, customers }
      } catch (e: any) {
        results[project.name] = { error: e.message }
      }
    }

    return NextResponse.json({ synced: results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
