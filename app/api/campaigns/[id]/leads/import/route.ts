import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { leads } = await req.json()
    const campaignId = params.id

    if (!leads?.length) {
      return NextResponse.json({ error: 'No leads provided' }, { status: 400 })
    }

    const rows = leads.map((l: any) => ({
      campaign_id: campaignId,
      email: l.email.toLowerCase().trim(),
      name: l.name || null,
      company: l.company || null,
      phone: l.phone || null,
      status: 'pending',
      current_step: 0,
    }))

    // Upsert – skip duplicates
    const { data, error } = await supabaseAdmin
      .from('leads')
      .upsert(rows, { onConflict: 'campaign_id,email', ignoreDuplicates: true })
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const imported = data?.length ?? 0
    const skipped = leads.length - imported

    return NextResponse.json({ imported, skipped })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
