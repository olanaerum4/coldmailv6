'use client'
import { useState } from 'react'

export default function CalendarClient({ leads, emailsSent, sequences }: any) {
  const [view, setView] = useState<'timeline' | 'list'>('timeline')

  // Build next-send map per lead
  const lastSentMap: Record<string, string> = {}
  for (const e of emailsSent) {
    if (!lastSentMap[e.lead_id]) lastSentMap[e.lead_id] = e.sent_at
  }

  const seqMap: Record<string, any> = {}
  for (const s of sequences) seqMap[s.id] = s

  interface ScheduledLead { lead: any; nextDate: Date; nextSubject: string; daysFromNow: number }
  const scheduled: ScheduledLead[] = []
  for (const lead of leads) {
    const lastSent = lastSentMap[lead.id]
    if (!lastSent) continue
    const nextStep = sequences.find((s: any) => s.campaign_id === lead.campaign_id && s.step_number === lead.current_step + 1)
    if (!nextStep) continue
    const lastDate = new Date(lastSent)
    const nextDate = new Date(lastDate.getTime() + nextStep.delay_days * 86400000)
    const daysFromNow = Math.round((nextDate.getTime() - Date.now()) / 86400000)
    scheduled.push({ lead, nextDate, nextSubject: nextStep.subject, daysFromNow })
  }
  scheduled.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime())

  // Group by day
  const dayGroups: Record<string, ScheduledLead[]> = {}
  for (const s of scheduled.slice(0, 100)) {
    const day = s.nextDate.toISOString().split('T')[0]
    if (!dayGroups[day]) dayGroups[day] = []
    dayGroups[day].push(s)
  }

  const today = new Date().toISOString().split('T')[0]

  if (scheduled.length === 0) {
    return (
      <div style={{ background: '#fff', border: '2px dashed #e2e8f0', borderRadius: 16, padding: 60, textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: '#94a3b8' }}>Ingen planlagte e-poster</p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>Aktiver en kampanje for å se kalenderen</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['timeline', 'list'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 99, cursor: 'pointer', border: '1.5px solid', borderColor: view === v ? '#2563eb' : '#e2e8f0', background: view === v ? '#eff6ff' : '#fff', color: view === v ? '#2563eb' : '#64748b' }}>
            {v === 'timeline' ? '📅 Tidslinje' : '📋 Liste'}
          </button>
        ))}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#94a3b8', alignSelf: 'center', marginLeft: 4 }}>
          {scheduled.length} planlagte e-poster
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.entries(dayGroups).map(([day, items]) => {
          const isToday = day === today
          const isPast = day < today
          const date = new Date(day)
          const dateLabel = isToday ? 'I dag' : date.toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' })

          return (
            <div key={day}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: isToday ? '#2563eb' : isPast ? '#94a3b8' : '#0f172a', padding: '3px 10px', borderRadius: 99, background: isToday ? '#eff6ff' : '#f8fafc', border: `1px solid ${isToday ? '#bfdbfe' : '#e2e8f0'}` }}>
                  {dateLabel}
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#94a3b8' }}>{items.length} e-poster</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 4 }}>
                {items.map(({ lead, nextSubject }, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, opacity: isPast ? 0.6 : 1 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: isPast ? '#cbd5e1' : '#2563eb', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{lead.name || lead.email}</span>
                      {lead.company && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#64748b' }}> · {lead.company}</span>}
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#94a3b8', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {nextSubject}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
