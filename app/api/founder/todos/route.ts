import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { project_id, text } = await req.json()
  const { data, error } = await supabaseAdmin
    .from('founder_todos')
    .insert({ project_id, text, done: false })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
