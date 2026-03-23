import { supabaseAdmin } from '@/lib/supabase'
import LeaderboardClient from '@/components/LeaderboardClient'

export const revalidate = 0

async function getData() {
  const today = new Date(); today.setHours(0,0,0,0)
  const weekAgo = new Date(Date.now() - 7 * 86400000)

  const [
    { count: sentToday },
    { count: repliedToday },
    { count: sentWeek },
    { count: repliedWeek },
    { data: goal },
    { data: dailyStats },
  ] = await Promise.all([
    supabaseAdmin.from('emails_sent').select('id',{count:'exact',head:true}).gte('sent_at', today.toISOString()),
    supabaseAdmin.from('emails_sent').select('id',{count:'exact',head:true}).gte('replied_at', today.toISOString()).not('replied_at','is',null),
    supabaseAdmin.from('emails_sent').select('id',{count:'exact',head:true}).gte('sent_at', weekAgo.toISOString()),
    supabaseAdmin.from('emails_sent').select('id',{count:'exact',head:true}).gte('replied_at', weekAgo.toISOString()).not('replied_at','is',null),
    supabaseAdmin.from('outreach_goals').select('*').limit(1).single(),
    supabaseAdmin.from('emails_sent').select('sent_at').gte('sent_at', weekAgo.toISOString()).order('sent_at'),
  ])

  // Build daily breakdown for last 7 days
  const dayMap: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    dayMap[d.toISOString().split('T')[0]] = 0
  }
  for (const e of dailyStats ?? []) {
    const day = e.sent_at.split('T')[0]
    if (day in dayMap) dayMap[day]++
  }

  return {
    sentToday: sentToday ?? 0,
    repliedToday: repliedToday ?? 0,
    sentWeek: sentWeek ?? 0,
    repliedWeek: repliedWeek ?? 0,
    goal: goal ?? { daily_emails: 10, daily_replies: 2, streak_days: 0 },
    dailyBreakdown: Object.entries(dayMap).map(([date, count]) => ({ date, count })),
  }
}

export default async function LeaderboardPage() {
  const data = await getData()
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-mono font-bold" style={{ color: 'var(--text)' }}>🏆 Leaderboard</h1>
        <p className="text-sm mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>Gamifiser outreach – bygg streak og nå daglige mål</p>
      </div>
      <LeaderboardClient {...data} />
    </div>
  )
}
