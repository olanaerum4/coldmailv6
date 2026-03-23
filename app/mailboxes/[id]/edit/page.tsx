import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import MailboxForm from '@/components/MailboxForm'
import Link from 'next/link'

export const revalidate = 0

export default async function EditMailboxPage({ params }: { params: { id: string } }) {
  const { data: mailbox } = await supabaseAdmin
    .from('mailboxes')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!mailbox) notFound()

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/mailboxes" className="text-sm font-mono block mb-4" style={{ color: 'var(--text-muted)' }}>
        ← Tilbake
      </Link>
      <h1 className="text-2xl font-mono font-bold mb-6" style={{ color: 'var(--text)' }}>Rediger mailboks</h1>
      <MailboxForm mailbox={mailbox} />
    </div>
  )
}
