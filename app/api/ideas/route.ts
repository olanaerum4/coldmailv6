import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabaseAdmin.from('ideas').select('*').order('created_at', { ascending: false })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { text, project_id } = await req.json()
  const { data, error } = await supabaseAdmin
    .from('ideas')
    .insert({ text, project_id: project_id || null, status: 'new' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
