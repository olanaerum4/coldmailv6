import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data: campaign, error } = await supabaseAdmin
    .from('campaigns')
    .select('*, sequences(*)')
    .eq('id', params.id)
    .order('step_number', { referencedTable: 'sequences', ascending: true })
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  const [leads, emails] = await Promise.all([
    supabaseAdmin.from('leads').select('id', { count: 'exact', head: true }).eq('campaign_id', params.id),
    supabaseAdmin.from('emails_sent').select('open_count, click_count, replied_at').eq('campaign_id', params.id),
  ])

  const emailData = emails.data || []
  return NextResponse.json({
    ...campaign,
    lead_count: leads.count || 0,
    sent_count: emailData.length,
    open_count: emailData.filter((e: any) => e.open_count > 0).length,
    click_count: emailData.filter((e: any) => e.click_count > 0).length,
    reply_count: emailData.filter((e: any) => e.replied_at).length,
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const allowed = ['name', 'from_email', 'from_name', 'status']
  const updates: Record<string, any> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error } = await supabaseAdmin
    .from('campaigns')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabaseAdmin.from('campaigns').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
