import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import MailboxList from '@/components/MailboxList'

export const revalidate = 0

async function getMailboxes() {
  const { data } = await supabaseAdmin
    .from('mailboxes')
    .select('*, mailbox_sends(id, sent_at)')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function MailboxesPage() {
  const mailboxes = await getMailboxes()

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-mono font-bold" style={{ color: 'var(--text)' }}>Mailbokser</h1>
          <p className="text-sm mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
            SMTP-kontoer med sending-limiter
          </p>
        </div>
        <Link
          href="/mailboxes/new"
          className="px-4 py-2 text-sm font-mono font-bold rounded-lg text-white transition-colors"
          style={{ background: 'var(--accent)' }}
        >
          + Legg til mailboks
        </Link>
      </div>
      <MailboxList mailboxes={mailboxes} />
    </div>
  )
}
