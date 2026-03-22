import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const q = searchParams.get('q')

  let query = supabaseAdmin
    .from('leads')
    .select('*')
    .eq('campaign_id', params.id)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (q) query = query.ilike('email', `%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { leadIds } = await req.json()
  const { error } = await supabaseAdmin
    .from('leads')
    .delete()
    .in('id', leadIds)
    .eq('campaign_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
