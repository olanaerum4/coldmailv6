import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  const eid = searchParams.get('eid')

  if (!url) {
    return NextResponse.redirect('/')
  }

  if (eid) {
    try {
      const { data: es } = await supabaseAdmin
        .from('emails_sent')
        .select('click_count, clicked_at')
        .eq('id', eid)
        .single()

      if (es) {
        await supabaseAdmin
          .from('emails_sent')
          .update({
            click_count: (es.click_count ?? 0) + 1,
            clicked_at: es.clicked_at ?? new Date().toISOString(),
          })
          .eq('id', eid)
      }
    } catch (_) {}
  }

  return NextResponse.redirect(decodeURIComponent(url))
}
