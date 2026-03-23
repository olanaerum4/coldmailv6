import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { data: existing } = await supabaseAdmin.from('outreach_goals').select('id').limit(1).single()
  if (existing) {
    const { data } = await supabaseAdmin.from('outreach_goals').update({ ...body, updated_at: new Date().toISOString() }).eq('id', existing.id).select().single()
    return NextResponse.json(data)
  }
  const { data } = await supabaseAdmin.from('outreach_goals').insert(body).select().single()
  return NextResponse.json(data)
}
