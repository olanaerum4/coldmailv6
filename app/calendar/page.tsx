import { supabaseAdmin } from '@/lib/supabase'
import CalendarClient from '@/components/CalendarClient'

export const revalidate = 0

async function getData() {
  const in14days = new Date(Date.now() + 14 * 86400000).toISOString()
  const { data: leads } = await supabaseAdmin
    .from('leads')
    .select('id, email, name, company, status, current_step, campaign_id, created_at')
    .eq('status', 'active')
    .order('created_at')
    .limit(200)

  const { data: emailsSent } = await supabaseAdmin
    .from('emails_sent')
    .select('lead_id, sent_at, sequence_id')
    .order('sent_at', { ascending: false })

  const { data: sequences } = await supabaseAdmin
    .from('sequences')
    .select('id, campaign_id, step_number, delay_days, subject')

  return { leads: leads ?? [], emailsSent: emailsSent ?? [], sequences: sequences ?? [] }
}

export default async function CalendarPage() {
  const data = await getData()
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-mono font-bold" style={{ color: 'var(--text)' }}>🗓 Outreach-kalender</h1>
        <p className="text-sm mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>Se når hvert lead mottar neste e-post</p>
      </div>
      <CalendarClient {...data} />
    </div>
  )
}
