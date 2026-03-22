import { supabaseAdmin } from '@/lib/supabase'
import { InboxMessage } from '@/types'
import InboxClient from '@/components/InboxClient'

async function getMessages(): Promise<InboxMessage[]> {
  const { data } = await supabaseAdmin
    .from('inbox_messages')
    .select('*, leads(email, name, company)')
    .order('received_at', { ascending: false })
  return data ?? []
}

export default async function InboxPage() {
  const messages = await getMessages()
  const unread = messages.filter((m: any) => !m.read).length

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-mono font-bold text-zinc-100">
          Innboks
          {unread > 0 && (
            <span className="ml-3 px-2 py-0.5 bg-cyan-500 text-black text-xs font-bold rounded-full">{unread}</span>
          )}
        </h1>
        <p className="text-sm text-zinc-500 mt-1 font-mono">{messages.length} meldinger totalt</p>
      </div>
      <InboxClient messages={messages} />
    </div>
  )
}
