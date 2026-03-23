import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import nodemailer from 'nodemailer'

// Warm-up progression: day -> emails to send that day
function warmupTarget(day: number): number {
  // Gradual ramp: 2, 4, 6, 9, 12, 16, 20, 25, 30, 35, 40...
  if (day <= 1) return 2
  if (day <= 3) return 4
  if (day <= 5) return 6
  if (day <= 7) return 9
  if (day <= 10) return 12
  if (day <= 14) return 16
  if (day <= 18) return 20
  if (day <= 22) return 25
  if (day <= 26) return 30
  return Math.min(40, 30 + (day - 26) * 2)
}

const WARMUP_SUBJECTS = [
  'Oppfølging fra møtet',
  'Raskt spørsmål',
  'Takk for sist',
  'Sjekker inn',
  'Kort oppdatering',
  'Re: Prosjekt',
  'Hei igjen',
]

const WARMUP_BODIES = [
  'Hei! Bare ville sjekke inn etter sist. Håper alt er bra.',
  'Hei, har du hatt sjansen til å se på det vi snakket om?',
  'Takk for sist, det var hyggelig! Gleder meg til videre samarbeid.',
  'Hei! Bare en rask hilsen. Ta gjerne kontakt hvis du trenger noe.',
  'Hei, ville bare si at jeg er tilgjengelig denne uken hvis du vil snakkes.',
]

export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = { sent: 0, skipped: 0, errors: 0 }

  try {
    // Get all active warm-up schedules with mailbox details
    const { data: schedules } = await supabaseAdmin
      .from('warmup_schedule')
      .select('*, mailboxes(*)')
      .eq('active', true)

    if (!schedules?.length) {
      return NextResponse.json({ ...results, message: 'No active warmup schedules' })
    }

    // Need at least 2 mailboxes to warm up between
    const activeMailboxes = schedules
      .map((s: any) => s.mailboxes)
      .filter(Boolean)

    if (activeMailboxes.length < 2) {
      return NextResponse.json({ ...results, message: 'Need at least 2 mailboxes for warmup' })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const schedule of schedules) {
      const mailbox = schedule.mailboxes
      if (!mailbox) continue

      const target = warmupTarget(schedule.day)
      const alreadySent = schedule.emails_today ?? 0

      if (alreadySent >= target) {
        results.skipped++
        continue
      }

      // Pick a random different mailbox to send to
      const targets = activeMailboxes.filter((m: any) => m.id !== mailbox.id)
      if (!targets.length) continue
      const toMailbox = targets[Math.floor(Math.random() * targets.length)]

      try {
        const subject = WARMUP_SUBJECTS[Math.floor(Math.random() * WARMUP_SUBJECTS.length)]
        const body = WARMUP_BODIES[Math.floor(Math.random() * WARMUP_BODIES.length)]

        const transporter = nodemailer.createTransport({
          host: mailbox.smtp_host,
          port: mailbox.smtp_port,
          secure: mailbox.smtp_port === 465,
          auth: { user: mailbox.smtp_user, pass: mailbox.smtp_password },
        })

        await transporter.sendMail({
          from: `${mailbox.name} <${mailbox.email}>`,
          to: toMailbox.email,
          subject,
          text: body,
        })

        // Log warmup email
        await supabaseAdmin.from('warmup_emails').insert({
          from_mailbox_id: mailbox.id,
          to_mailbox_id: toMailbox.id,
          subject,
        })

        // Update schedule counter
        const isNewDay = !schedule.last_run_at ||
          new Date(schedule.last_run_at) < today

        await supabaseAdmin
          .from('warmup_schedule')
          .update({
            emails_today: isNewDay ? 1 : alreadySent + 1,
            day: isNewDay ? schedule.day + 1 : schedule.day,
            last_run_at: new Date().toISOString(),
          })
          .eq('id', schedule.id)

        results.sent++
      } catch (e) {
        console.error('warmup error', mailbox.email, e)
        results.errors++
      }
    }

    return NextResponse.json(results)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
