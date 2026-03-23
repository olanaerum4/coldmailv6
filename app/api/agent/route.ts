import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

// Verify agent API key
async function verifyKey(req: NextRequest): Promise<boolean> {
  const key = req.headers.get('X-Agent-Key') ?? req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!key) return false

  // Allow CRON_SECRET as agent key too
  if (key === process.env.CRON_SECRET) return true

  const hash = crypto.createHash('sha256').update(key).digest('hex')
  const { data } = await supabaseAdmin
    .from('agent_keys')
    .select('id')
    .eq('key_hash', hash)
    .single()

  if (data) {
    // Update last_used_at
    await supabaseAdmin.from('agent_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id)
    return true
  }
  return false
}

/**
 * Agent API – designed for OpenClaw / AI agents
 *
 * POST /api/agent
 * Body: { action: string, ...params }
 *
 * Actions:
 *   get_campaigns          – list all campaigns
 *   get_leads              – { campaign_id?, status? }
 *   add_leads              – { campaign_id, leads: [{email, name, company}] }
 *   get_inbox              – { limit? } – unread replies
 *   mark_reply             – { message_id, interest_status }
 *   get_stats              – dashboard totals
 *   get_unsubscribes       – list global unsubscribes
 *   add_unsubscribe        – { email }
 *   pause_campaign         – { campaign_id }
 *   activate_campaign      – { campaign_id }
 *   get_mailboxes          – list mailboxes + today's send count
 */
export async function POST(req: NextRequest) {
  if (!await verifyKey(req)) {
    return NextResponse.json({ error: 'Unauthorized – include X-Agent-Key header' }, { status: 401 })
  }

  const body = await req.json()
  const { action } = body

  try {
    switch (action) {

      case 'get_campaigns': {
        const { data } = await supabaseAdmin
          .from('campaign_stats')
          .select('*')
          .order('emails_sent', { ascending: false })
        return NextResponse.json({ campaigns: data })
      }

      case 'get_leads': {
        let q = supabaseAdmin.from('leads').select('*').order('created_at', { ascending: false })
        if (body.campaign_id) q = q.eq('campaign_id', body.campaign_id)
        if (body.status) q = q.eq('status', body.status)
        if (body.limit) q = q.limit(body.limit)
        const { data } = await q
        return NextResponse.json({ leads: data, count: data?.length ?? 0 })
      }

      case 'add_leads': {
        const { campaign_id, leads } = body
        if (!campaign_id || !leads?.length) {
          return NextResponse.json({ error: 'campaign_id and leads required' }, { status: 400 })
        }
        const rows = leads.map((l: any) => ({
          campaign_id,
          email: l.email.toLowerCase().trim(),
          name: l.name ?? null,
          company: l.company ?? null,
          phone: l.phone ?? null,
          status: 'pending',
          current_step: 0,
        }))
        const { data, error } = await supabaseAdmin
          .from('leads')
          .upsert(rows, { onConflict: 'campaign_id,email', ignoreDuplicates: true })
          .select()
        return NextResponse.json({ imported: data?.length ?? 0, error: error?.message })
      }

      case 'get_inbox': {
        const limit = body.limit ?? 20
        const { data } = await supabaseAdmin
          .from('inbox_messages')
          .select('*, leads(email, name, company)')
          .eq('read', false)
          .order('received_at', { ascending: false })
          .limit(limit)
        return NextResponse.json({ messages: data, unread: data?.length ?? 0 })
      }

      case 'mark_reply': {
        const { message_id, interest_status } = body
        const { error } = await supabaseAdmin
          .from('inbox_messages')
          .update({ interest_status, read: true })
          .eq('id', message_id)
        return NextResponse.json({ ok: !error, error: error?.message })
      }

      case 'get_stats': {
        const { data: stats } = await supabaseAdmin.from('campaign_stats').select('*')
        const totals = (stats ?? []).reduce(
          (acc: any, s: any) => ({
            leads: acc.leads + Number(s.total_leads),
            sent: acc.sent + Number(s.emails_sent),
            opened: acc.opened + Number(s.emails_opened),
            replied: acc.replied + Number(s.emails_replied),
          }),
          { leads: 0, sent: 0, opened: 0, replied: 0 }
        )
        return NextResponse.json({ stats: totals, per_campaign: stats })
      }

      case 'get_unsubscribes': {
        const { data } = await supabaseAdmin
          .from('global_unsubscribes')
          .select('email, reason, created_at')
          .order('created_at', { ascending: false })
        return NextResponse.json({ unsubscribes: data })
      }

      case 'add_unsubscribe': {
        const { email } = body
        await supabaseAdmin
          .from('global_unsubscribes')
          .upsert({ email: email.toLowerCase(), reason: 'manual' }, { onConflict: 'email', ignoreDuplicates: true })
        return NextResponse.json({ ok: true })
      }

      case 'pause_campaign': {
        await supabaseAdmin.from('campaigns').update({ status: 'paused' }).eq('id', body.campaign_id)
        return NextResponse.json({ ok: true })
      }

      case 'activate_campaign': {
        await supabaseAdmin.from('campaigns').update({ status: 'active' }).eq('id', body.campaign_id)
        return NextResponse.json({ ok: true })
      }

      case 'get_mailboxes': {
        const { data: mailboxes } = await supabaseAdmin.from('mailboxes').select('id, name, email, daily_limit, active')
        const today = new Date(); today.setHours(0,0,0,0)
        const { data: sends } = await supabaseAdmin
          .from('mailbox_sends')
          .select('mailbox_id')
          .gte('sent_at', today.toISOString())
        const counts: Record<string, number> = {}
        for (const s of sends ?? []) counts[s.mailbox_id] = (counts[s.mailbox_id] ?? 0) + 1
        const result = (mailboxes ?? []).map((m: any) => ({
          ...m,
          sent_today: counts[m.id] ?? 0,
          remaining_today: m.daily_limit - (counts[m.id] ?? 0),
        }))
        return NextResponse.json({ mailboxes: result })
      }

      default:
        return NextResponse.json({
          error: `Unknown action: ${action}`,
          available_actions: [
            'get_campaigns', 'get_leads', 'add_leads',
            'get_inbox', 'mark_reply', 'get_stats',
            'get_unsubscribes', 'add_unsubscribe',
            'pause_campaign', 'activate_campaign', 'get_mailboxes',
          ],
        }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'OutreachOS Agent API',
    version: '1.0',
    docs: 'POST /api/agent med X-Agent-Key header og { action: string } body',
    actions: [
      'get_campaigns', 'get_leads', 'add_leads',
      'get_inbox', 'mark_reply', 'get_stats',
      'get_unsubscribes', 'add_unsubscribe',
      'pause_campaign', 'activate_campaign', 'get_mailboxes',
    ],
  })
}
