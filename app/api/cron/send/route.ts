import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { buildEmailBody, replaceVars } from '@/lib/email'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = { sent: 0, errors: 0, skipped: 0, limited: 0 }

  try {
    // Get active campaigns with their assigned mailbox (or any active mailbox)
    const { data: campaigns } = await supabaseAdmin
      .from('campaigns')
      .select('id, from_name, mailbox_id')
      .eq('status', 'active')

    if (!campaigns?.length) {
      return NextResponse.json({ ...results, message: 'No active campaigns' })
    }

    // Get all active mailboxes
    const { data: allMailboxes } = await supabaseAdmin
      .from('mailboxes')
      .select('*')
      .eq('active', true)

    if (!allMailboxes?.length) {
      return NextResponse.json({ ...results, message: 'No active mailboxes' })
    }

    // Build today's send count per mailbox
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: todaySends } = await supabaseAdmin
      .from('mailbox_sends')
      .select('mailbox_id')
      .gte('sent_at', today.toISOString())

    const sendCountMap: Record<string, number> = {}
    for (const s of todaySends ?? []) {
      sendCountMap[s.mailbox_id] = (sendCountMap[s.mailbox_id] ?? 0) + 1
    }

    // Build last-sent time per mailbox
    const { data: recentSends } = await supabaseAdmin
      .from('mailbox_sends')
      .select('mailbox_id, sent_at')
      .order('sent_at', { ascending: false })

    const lastSentMap: Record<string, Date> = {}
    for (const s of recentSends ?? []) {
      if (!lastSentMap[s.mailbox_id]) {
        lastSentMap[s.mailbox_id] = new Date(s.sent_at)
      }
    }

    for (const campaign of campaigns) {
      const { data: sequences } = await supabaseAdmin
        .from('sequences')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('step_number')

      if (!sequences?.length) continue

      // Pick mailbox for this campaign
      let mailbox = campaign.mailbox_id
        ? allMailboxes.find((m) => m.id === campaign.mailbox_id)
        : null

      // Round-robin fallback: pick mailbox with most remaining quota
      if (!mailbox) {
        mailbox = allMailboxes
          .filter((m) => (sendCountMap[m.id] ?? 0) < m.daily_limit)
          .sort((a, b) => {
            const remainA = a.daily_limit - (sendCountMap[a.id] ?? 0)
            const remainB = b.daily_limit - (sendCountMap[b.id] ?? 0)
            return remainB - remainA
          })[0]
      }

      if (!mailbox) {
        results.limited++
        continue
      }

      // Check daily limit
      const sentToday = sendCountMap[mailbox.id] ?? 0
      if (sentToday >= mailbox.daily_limit) {
        results.limited++
        continue
      }

      // Check interval (minutes since last send from this mailbox)
      const lastSent = lastSentMap[mailbox.id]
      if (lastSent) {
        const minsSinceLast = (Date.now() - lastSent.getTime()) / 60000
        if (minsSinceLast < mailbox.interval_minutes) {
          results.skipped++
          continue
        }
      }

      // Get one pending lead (one at a time per cron run to respect interval)
      const { data: pendingLeads } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('status', 'pending')
        .limit(1)

      const { data: activeLeads } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('status', 'active')

      // Combine: pending first, then active leads due for follow-up
      const leadsToProcess: any[] = [...(pendingLeads ?? [])]

      for (const lead of activeLeads ?? []) {
        const nextStepNum = lead.current_step + 1
        const nextSeq = sequences.find((s: any) => s.step_number === nextStepNum)
        if (!nextSeq) continue

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
          leadsToProcess.push({ ...lead, _nextSeq: nextSeq })
        }
      }

      if (!leadsToProcess.length) continue

      // Send to first eligible lead (interval controls rate)
      const lead = leadsToProcess[0]
      const seq = lead._nextSeq ?? sequences[0]

      try {
        await sendViaSmtp(lead, seq, campaign, mailbox)
        sendCountMap[mailbox.id] = (sendCountMap[mailbox.id] ?? 0) + 1
        lastSentMap[mailbox.id] = new Date()
        results.sent++
      } catch (e) {
        console.error('send error', lead.email, e)
        results.errors++
      }
    }

    return NextResponse.json(results)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

async function sendViaSmtp(lead: any, sequence: any, campaign: any, mailbox: any) {
  const subject = replaceVars(sequence.subject, lead)
  const body = replaceVars(sequence.body, lead)

  const { data: emailSent, error: esErr } = await supabaseAdmin
    .from('emails_sent')
    .insert({ lead_id: lead.id, sequence_id: sequence.id, campaign_id: campaign.id })
    .select()
    .single()

  if (esErr || !emailSent) throw new Error(esErr?.message ?? 'Failed to create email_sent')

  const { data: pixel } = await supabaseAdmin
    .from('tracking_pixels')
    .insert({ email_sent_id: emailSent.id })
    .select()
    .single()

  const htmlBody = buildEmailBody(body, lead.id, emailSent.id, pixel?.id ?? '')

  const transporter = nodemailer.createTransport({
    host: mailbox.smtp_host,
    port: mailbox.smtp_port,
    secure: mailbox.smtp_port === 465,
    auth: { user: mailbox.smtp_user, pass: mailbox.smtp_password },
  })

  await transporter.sendMail({
    from: `${campaign.from_name || mailbox.name} <${mailbox.email}>`,
    to: lead.email,
    subject,
    html: htmlBody,
    headers: {
      'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_APP_URL}/api/unsubscribe?lead=${lead.id}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  })

  // Record send in mailbox_sends
  await supabaseAdmin
    .from('mailbox_sends')
    .insert({ mailbox_id: mailbox.id, email_sent_id: emailSent.id })

  // Update lead status
  await supabaseAdmin
    .from('leads')
    .update({ status: 'active', current_step: sequence.step_number })
    .eq('id', lead.id)
}
