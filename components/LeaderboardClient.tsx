'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  sentToday: number
  repliedToday: number
  sentWeek: number
  repliedWeek: number
  goal: { id?: string; daily_emails: number; daily_replies: number; streak_days: number }
  dailyBreakdown: { date: string; count: number }[]
}

export default function LeaderboardClient({ sentToday, repliedToday, sentWeek, repliedWeek, goal, dailyBreakdown }: Props) {
  const router = useRouter()
  const [editGoal, setEditGoal] = useState(false)
  const [goalEmails, setGoalEmails] = useState(String(goal.daily_emails))
  const [goalReplies, setGoalReplies] = useState(String(goal.daily_replies))
  const [saving, setSaving] = useState(false)

  const emailPct = Math.min(100, Math.round((sentToday / goal.daily_emails) * 100))
  const replyPct = Math.min(100, Math.round((repliedToday / goal.daily_replies) * 100))
  const dayGoalMet = sentToday >= goal.daily_emails

  const maxDay = Math.max(...dailyBreakdown.map(d => d.count), 1)

  async function saveGoal() {
    setSaving(true)
    await fetch('/api/outreach-goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ daily_emails: parseInt(goalEmails), daily_replies: parseInt(goalReplies) }),
    })
    setSaving(false)
    setEditGoal(false)
    router.refresh()
  }

  const ranks = [
    { min: 0,  max: 9,  label: 'Nybegynner', emoji: '🌱', color: '#94a3b8' },
    { min: 10, max: 49, label: 'Aktiv',       emoji: '⚡', color: '#2563eb' },
    { min: 50, max: 99, label: 'Pro',          emoji: '🔥', color: '#d97706' },
    { min: 100, max: 999, label: 'Elite',      emoji: '👑', color: '#7c3aed' },
  ]
  const rank = ranks.find(r => sentWeek >= r.min && sentWeek <= r.max) ?? ranks[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Streak + rank */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 48, lineHeight: 1 }}>🔥</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 48, fontWeight: 900, color: '#d97706', lineHeight: 1.1 }}>{goal.streak_days}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#94a3b8', marginTop: 4 }}>dagers streak</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#cbd5e1', marginTop: 2 }}>
            {dayGoalMet ? '✓ Dagens mål nådd!' : `${goal.daily_emails - sentToday} igjen for å holde streaken`}
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 48, lineHeight: 1 }}>{rank.emoji}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 900, color: rank.color, lineHeight: 1.2 }}>{rank.label}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{sentWeek} sendt denne uken</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#cbd5e1', marginTop: 2 }}>
            {ranks.find(r => r.min > sentWeek) ? `${ranks.find(r => r.min > sentWeek)!.min - sentWeek} til ${ranks.find(r => r.min > sentWeek)!.label}` : 'Topp rank!'}
          </div>
        </div>
      </div>

      {/* Today's goals */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>Dagens mål</h2>
          <button onClick={() => setEditGoal(!editGoal)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
            ✏ Endre mål
          </button>
        </div>

        {editGoal && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: 3 }}>E-poster/dag</label>
              <input type="number" value={goalEmails} onChange={e => setGoalEmails(e.target.value)} style={{ fontFamily: 'var(--font-mono)', fontSize: 13, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, width: 80, outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Svar/dag</label>
              <input type="number" value={goalReplies} onChange={e => setGoalReplies(e.target.value)} style={{ fontFamily: 'var(--font-mono)', fontSize: 13, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, width: 80, outline: 'none' }} />
            </div>
            <button onClick={saveGoal} disabled={saving} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}>
              {saving ? '...' : 'Lagre'}
            </button>
          </div>
        )}

        {[
          { label: '📧 E-poster sendt', current: sentToday, goal: goal.daily_emails, pct: emailPct, color: '#2563eb' },
          { label: '💬 Svar mottatt', current: repliedToday, goal: goal.daily_replies, pct: replyPct, color: '#059669' },
        ].map(({ label, current, goal: g, pct, color }) => (
          <div key={label} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#0f172a' }}>{label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color }}>
                {current} / {g} {pct >= 100 ? '✓' : `(${pct}%)`}
              </span>
            </div>
            <div style={{ height: 10, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#059669' : color, borderRadius: 99, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        ))}
      </div>

      {/* 7-day bar chart */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Siste 7 dager</h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
          {dailyBreakdown.map(({ date, count }) => {
            const h = Math.round((count / maxDay) * 72) || 4
            const isToday = date === new Date().toISOString().split('T')[0]
            const dayName = new Date(date).toLocaleDateString('nb-NO', { weekday: 'short' })
            const goalMet = count >= goal.daily_emails
            return (
              <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#64748b' }}>{count}</span>
                <div style={{ width: '100%', height: h, background: goalMet ? '#059669' : isToday ? '#2563eb' : '#bfdbfe', borderRadius: '3px 3px 0 0', transition: 'height 0.3s' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: isToday ? '#2563eb' : '#94a3b8', fontWeight: isToday ? 700 : 400 }}>
                  {isToday ? 'I dag' : dayName}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Week stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { label: 'Sendt denne uken', value: sentWeek, color: '#2563eb' },
          { label: 'Svar denne uken', value: repliedWeek, color: '#059669' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, margin: '0 0 4px' }}>{label}</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 800, color, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
