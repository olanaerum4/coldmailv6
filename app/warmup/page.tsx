import { supabaseAdmin } from '@/lib/supabase'
import WarmupClient from '@/components/WarmupClient'

export const revalidate = 0

async function getData() {
  const [{ data: schedules }, { data: mailboxes }] = await Promise.all([
    supabaseAdmin.from('warmup_schedule').select('*, mailboxes(name, email)').order('started_at'),
    supabaseAdmin.from('mailboxes').select('id, name, email').eq('active', true),
  ])
  return { schedules: schedules ?? [], mailboxes: mailboxes ?? [] }
}

export default async function WarmupPage() {
  const { schedules, mailboxes } = await getData()
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-mono font-bold" style={{ color: 'var(--text)' }}>Email Warm-up</h1>
        <p className="text-sm mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
          Gradvis bygg opp avsender-omdømme for å unngå spam
        </p>
      </div>

      {/* How it works */}
      <div className="rounded-xl p-5 mb-6" style={{ background: '#fafafa', border: '1px solid var(--border)' }}>
        <h2 className="text-xs font-mono font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Slik fungerer det</h2>
        <div className="grid grid-cols-4 gap-4 text-xs font-mono">
          {[
            { day: 'Dag 1–3', count: '2–4/dag' },
            { day: 'Dag 4–7', count: '6–9/dag' },
            { day: 'Dag 8–14', count: '12–16/dag' },
            { day: 'Dag 15+', count: '20–40/dag' },
          ].map(({ day, count }) => (
            <div key={day} className="text-center p-3 rounded-lg" style={{ background: '#fff', border: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text-muted)' }}>{day}</p>
              <p className="font-bold mt-1" style={{ color: 'var(--accent)' }}>{count}</p>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3 font-mono" style={{ color: 'var(--text-faint)' }}>
          E-poster sendes mellom dine egne mailbokser. Du trenger minst 2 aktive mailbokser.
        </p>
      </div>

      <WarmupClient schedules={schedules} mailboxes={mailboxes} />
    </div>
  )
}
