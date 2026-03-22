import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, from_email, from_name, status, sequences } = body

    // Create campaign
    const { data: campaign, error: campErr } = await supabaseAdmin
      .from('campaigns')
      .insert({ name, from_email, from_name, status })
      .select()
      .single()

    if (campErr || !campaign) {
      return NextResponse.json({ error: campErr?.message ?? 'Failed to create campaign' }, { status: 500 })
    }

    // Create sequences
    if (sequences?.length > 0) {
      const seqRows = sequences.map((s: any) => ({
        campaign_id: campaign.id,
        step_number: s.step_number,
        delay_days: s.delay_days,
        subject: s.subject,
        body: s.body,
      }))
      const { error: seqErr } = await supabaseAdmin.from('sequences').insert(seqRows)
      if (seqErr) {
        return NextResponse.json({ error: seqErr.message }, { status: 500 })
      }
    }

    return NextResponse.json(campaign)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
