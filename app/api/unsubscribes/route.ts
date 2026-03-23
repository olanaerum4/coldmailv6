import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  let query = supabaseAdmin
    .from('global_unsubscribes')
    .select('*')
    .order('created_at', { ascending: false })
  if (q) query = query.ilike('email', `%${q}%`)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { email, reason } = await req.json()
  const { error } = await supabaseAdmin
    .from('global_unsubscribes')
    .upsert({ email: email.toLowerCase().trim(), reason: reason ?? 'manual' }, { onConflict: 'email', ignoreDuplicates: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { email } = await req.json()
  const { error } = await supabaseAdmin
    .from('global_unsubscribes')
    .delete()
    .eq('email', email.toLowerCase())
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
