import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendTelegram } from '@/lib/telegram'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // OutreachOS stats today
    const [
      { count: sentToday },
      { count: repliedToday },
      { data: newLeads },
      { data: projects },
      { data: unreadInbox },
    ] = await Promise.all([
      supabaseAdmin.from('emails_sent').select('id', { count: 'exact', head: true }).gte('sent_at', today.toISOString()),
      supabaseAdmin.from('emails_sent').select('id', { count: 'exact', head: true }).gte('replied_at', today.toISOString()).not('replied_at', 'is', null),
      supabaseAdmin.from('leads').select('id').gte('created_at', today.toISOString()),
      supabaseAdmin.from('founder_projects').select('name, mrr, customers, status').order('sort_order'),
      supabaseAdmin.from('inbox_messages').select('id').eq('read', false),
    ])

    const totalMRR = (projects ?? []).reduce((s: number, p: any) => s + (p.mrr ?? 0), 0)
    const totalCustomers = (projects ?? []).reduce((s: number, p: any) => s + (p.customers ?? 0), 0)

    const projectLines = (projects ?? [])
      .map((p: any) => {
        const statusEmoji: Record<string, string> = { active: '🟢', building: '🔵', paused: '⏸', idea: '💡' }
        return `${statusEmoji[p.status] ?? '⚪'} <b>${p.name}</b> — ${(p.mrr ?? 0).toLocaleString('nb-NO')} kr MRR · ${p.customers} kunder`
      })
      .join('\n')

    const message = `📊 <b>Daglig rapport</b> — ${new Date().toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' })}

💰 <b>Total MRR: ${totalMRR.toLocaleString('nb-NO')} kr</b>
👥 Kunder totalt: ${totalCustomers}

📧 <b>OutreachOS i dag:</b>
• ${sentToday ?? 0} e-poster sendt
• ${newLeads?.length ?? 0} nye leads importert
• ${repliedToday ?? 0} svar mottatt
• ${unreadInbox?.length ?? 0} uleste i innboks

<b>Prosjekter:</b>
${projectLines}

<a href="${process.env.NEXT_PUBLIC_APP_URL}/founder">→ Åpne dashboard</a>`

    await sendTelegram(message)

    return NextResponse.json({ ok: true, message: 'Report sent' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
