import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabaseAdmin
    .from('warmup_schedule')
    .select('*, mailboxes(name, email)')
    .order('started_at')
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { mailbox_id } = await req.json()
  const { data, error } = await supabaseAdmin
    .from('warmup_schedule')
    .insert({ mailbox_id, day: 1, emails_today: 0, max_per_day: 2, active: true })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
