import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { sequences } = await req.json()
    const campaignId = params.id

    // Delete all existing sequences
    const { error: delErr } = await supabaseAdmin
      .from('sequences')
      .delete()
      .eq('campaign_id', campaignId)

    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

    if (!sequences?.length) return NextResponse.json({ ok: true })

    // Insert new sequences
    const rows = sequences.map((s: any) => ({
      campaign_id: campaignId,
      step_number: s.step_number,
      delay_days: s.delay_days,
      subject: s.subject,
      body: s.body,
    }))

    const { error: insErr } = await supabaseAdmin.from('sequences').insert(rows)
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
