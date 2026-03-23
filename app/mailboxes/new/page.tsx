import MailboxForm from '@/components/MailboxForm'
import Link from 'next/link'

export default function NewMailboxPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/mailboxes" className="text-sm font-mono block mb-4" style={{ color: 'var(--text-muted)' }}>
        ← Tilbake
      </Link>
      <h1 className="text-2xl font-mono font-bold mb-6" style={{ color: 'var(--text)' }}>Ny mailboks</h1>
      <MailboxForm />
    </div>
  )
}
