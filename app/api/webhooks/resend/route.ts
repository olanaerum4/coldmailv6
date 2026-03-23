import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendTelegram } from '@/lib/telegram'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, data } = body

    if (type === 'email.bounced') {
      const toEmail = data?.to?.[0]
      if (toEmail) {
        await supabaseAdmin.from('leads').update({ status: 'bounced' }).eq('email', toEmail.toLowerCase())
      }
    }

    if (type === 'email.complained') {
      const toEmail = data?.to?.[0]
      if (toEmail) {
        await supabaseAdmin.from('leads').update({ status: 'unsubscribed' }).eq('email', toEmail.toLowerCase())
        await supabaseAdmin.from('global_unsubscribes').upsert(
          { email: toEmail.toLowerCase(), reason: 'complaint' },
          { onConflict: 'email', ignoreDuplicates: true }
        )
      }
    }

    if (type === 'inbound.email') {
      const fromEmail = data?.from?.toLowerCase()
      const subject = data?.subject
      const bodyText = data?.text || data?.html

      if (fromEmail) {
        const { data: lead } = await supabaseAdmin
          .from('leads')
          .select('id, campaign_id, name, company')
          .eq('email', fromEmail)
          .single()

        if (lead) {
          await supabaseAdmin.from('leads').update({ status: 'replied' }).eq('id', lead.id)

          await supabaseAdmin.from('inbox_messages').insert({
            lead_id: lead.id,
            from_email: fromEmail,
            from_name: data?.fromName ?? null,
            subject,
            body: bodyText,
          })

          const { data: latestEmail } = await supabaseAdmin
            .from('emails_sent')
            .select('id')
            .eq('lead_id', lead.id)
            .order('sent_at', { ascending: false })
            .limit(1)
            .single()

          if (latestEmail) {
            await supabaseAdmin.from('emails_sent').update({ replied_at: new Date().toISOString() }).eq('id', latestEmail.id)
          }

          // 🔔 Telegram notification
          const name = lead.name ?? fromEmail
          const company = lead.company ? ` (${lead.company})` : ''
          const preview = (bodyText ?? '').replace(/<[^>]+>/g, '').slice(0, 200).trim()
          await sendTelegram(
            `🔥 <b>Nytt svar på outreach!</b>\n\n` +
            `👤 <b>${name}${company}</b>\n` +
            `📧 ${fromEmail}\n` +
            `📨 ${subject ?? '(ingen emnelinje)'}\n\n` +
            `"${preview}${preview.length >= 200 ? '...' : ''}"\n\n` +
            `<a href="${process.env.NEXT_PUBLIC_APP_URL}/inbox">→ Åpne innboks</a>`
          )
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
