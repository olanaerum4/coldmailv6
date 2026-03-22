import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resend, buildEmailBody, replaceVars } from '@/lib/email'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = { sent: 0, errors: 0, skipped: 0 }

  try {
    const { data: campaigns } = await supabaseAdmin
      .from('campaigns')
      .select('id, from_email, from_name')
      .eq('status', 'active')

    if (!campaigns?.length) {
      return NextResponse.json({ ...results, message: 'No active campaigns' })
    }

    for (const campaign of campaigns) {
      const { data: sequences } = await supabaseAdmin
        .from('sequences')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('step_number')

      if (!sequences?.length) continue

      // Step 1: send to all pending leads
      const { data: pendingLeads } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('status', 'pending')

      for (const lead of pendingLeads ?? []) {
        try {
          await sendStep(lead, sequences[0], campaign)
          results.sent++
        } catch (e) {
          console.error('send error', lead.email, e)
          results.errors++
        }
      }

      // Follow-up steps: active leads ready for next step
      const { data: activeLeads } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('status', 'active')

      for (const lead of activeLeads ?? []) {
        const nextStepNum = lead.current_step + 1
        const nextSeq = sequences.find((s: any) => s.step_number === nextStepNum)

        if (!nextSeq) {
          // Completed all steps
          await supabaseAdmin.from('leads').update({ status: 'active' }).eq('id', lead.id)
          results.skipped++
          continue
        }

        const { data: lastEmail } = await supabaseAdmin
          .from('emails_sent')
          .select('sent_at')
          .eq('lead_id', lead.id)
          .order('sent_at', { ascending: false })
          .limit(1)
          .single()

        if (!lastEmail) continue

        const daysSince = (Date.now() - new Date(lastEmail.sent_at).getTime()) / 86_400_000
        if (daysSince >= nextSeq.delay_days) {
          try {
            await sendStep(lead, nextSeq, campaign)
            results.sent++
          } catch (e) {
            console.error('followup error', lead.email, e)
            results.errors++
          }
        } else {
          results.skipped++
        }
      }
    }

    return NextResponse.json(results)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

async function sendStep(lead: any, sequence: any, campaign: any) {
  const subject = replaceVars(sequence.subject, lead)
  const body = replaceVars(sequence.body, lead)

  const { data: emailSent, error: esErr } = await supabaseAdmin
    .from('emails_sent')
    .insert({
      lead_id: lead.id,
      sequence_id: sequence.id,
      campaign_id: campaign.id,
    })
    .select()
    .single()

  if (esErr || !emailSent) throw new Error(esErr?.message ?? 'Failed to create email_sent')

  const { data: pixel, error: pxErr } = await supabaseAdmin
    .from('tracking_pixels')
    .insert({ email_sent_id: emailSent.id })
    .select()
    .single()

  if (pxErr || !pixel) throw new Error('Failed to create tracking pixel')

  const htmlBody = buildEmailBody(body, lead.id, emailSent.id, pixel.id)

  const { error: sendErr } = await resend.emails.send({
    from: `${campaign.from_name} <${campaign.from_email}>`,
    to: lead.email,
    subject,
    html: htmlBody,
    headers: {
      'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_APP_URL}/api/unsubscribe?lead=${lead.id}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  })

  if (sendErr) throw new Error(String(sendErr))

  await supabaseAdmin
    .from('leads')
    .update({ status: 'active', current_step: sequence.step_number })
    .eq('id', lead.id)
}
