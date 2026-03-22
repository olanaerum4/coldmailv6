import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, data } = body

    // Resend sends events like 'email.opened', 'email.clicked', 'email.bounced', 'email.complained'
    // For reply detection, we rely on inbound email parsing (set up Resend inbound or use webhook)

    if (type === 'email.bounced') {
      const toEmail = data?.to?.[0]
      if (toEmail) {
        await supabaseAdmin
          .from('leads')
          .update({ status: 'bounced' })
          .eq('email', toEmail.toLowerCase())
      }
    }

    if (type === 'email.complained') {
      const toEmail = data?.to?.[0]
      if (toEmail) {
        await supabaseAdmin
          .from('leads')
          .update({ status: 'unsubscribed' })
          .eq('email', toEmail.toLowerCase())
      }
    }

    // Inbound reply (Resend inbound webhook format)
    if (type === 'inbound.email') {
      const fromEmail = data?.from?.toLowerCase()
      const subject = data?.subject
      const bodyText = data?.text || data?.html

      if (fromEmail) {
        // Find lead
        const { data: lead } = await supabaseAdmin
          .from('leads')
          .select('id, campaign_id')
          .eq('email', fromEmail)
          .single()

        if (lead) {
          // Mark lead as replied
          await supabaseAdmin
            .from('leads')
            .update({ status: 'replied' })
            .eq('id', lead.id)

          // Store inbox message
          await supabaseAdmin.from('inbox_messages').insert({
            lead_id: lead.id,
            from_email: fromEmail,
            from_name: data?.fromName ?? null,
            subject,
            body: bodyText,
          })

          // Mark latest email_sent as replied
          const { data: latestEmail } = await supabaseAdmin
            .from('emails_sent')
            .select('id')
            .eq('lead_id', lead.id)
            .order('sent_at', { ascending: false })
            .limit(1)
            .single()

          if (latestEmail) {
            await supabaseAdmin
              .from('emails_sent')
              .update({ replied_at: new Date().toISOString() })
              .eq('id', latestEmail.id)
          }
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
