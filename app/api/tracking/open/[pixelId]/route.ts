import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// 1x1 transparent PNG
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
)

export async function GET(
  req: NextRequest,
  { params }: { params: { pixelId: string } }
) {
  const { pixelId } = params

  try {
    // Look up pixel → email_sent
    const { data: pixel } = await supabaseAdmin
      .from('tracking_pixels')
      .select('email_sent_id')
      .eq('id', pixelId)
      .single()

    if (pixel) {
      // Update open tracking
      await supabaseAdmin.rpc('increment_open', { eid: pixel.email_sent_id })
      // Simplified: just update directly
      const { data: es } = await supabaseAdmin
        .from('emails_sent')
        .select('open_count, opened_at')
        .eq('id', pixel.email_sent_id)
        .single()

      if (es) {
        await supabaseAdmin
          .from('emails_sent')
          .update({
            open_count: (es.open_count ?? 0) + 1,
            opened_at: es.opened_at ?? new Date().toISOString(),
          })
          .eq('id', pixel.email_sent_id)
      }
    }
  } catch (_) {
    // Never let tracking errors break the pixel response
  }

  return new NextResponse(PIXEL, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
    },
  })
}
