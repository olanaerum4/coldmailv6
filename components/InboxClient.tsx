'use client'
import { useState } from 'react'
import { InboxMessage, InterestStatus } from '@/types'
import { useRouter } from 'next/navigation'

const interestLabels: Record<InterestStatus, string> = {
  interested: '✓ Interessert',
  not_interested: '✗ Ikke interessert',
  wrong_contact: '? Feil kontakt',
}

const interestColors: Record<InterestStatus, string> = {
  interested: 'text-emerald-400 border-emerald-800 bg-emerald-950/40',
  not_interested: 'text-red-400 border-red-800 bg-red-950/40',
  wrong_contact: 'text-amber-400 border-amber-800 bg-amber-950/40',
}

export default function InboxClient({ messages }: { messages: any[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<any | null>(null)
  const [updating, setUpdating] = useState(false)

  async function markInterest(messageId: string, status: InterestStatus) {
    setUpdating(true)
    await fetch(`/api/inbox/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interest_status: status, read: true }),
    })
    setUpdating(false)
    router.refresh()
    if (selected?.id === messageId) {
      setSelected({ ...selected, interest_status: status, read: true })
    }
  }

  if (messages.length === 0) {
    return (
      <div className="border border-dashed border-zinc-800 rounded-lg p-16 text-center">
        <p className="text-zinc-600 font-mono text-sm">Ingen innkommende meldinger ennå</p>
      </div>
    )
  }

  return (
    <div className="flex gap-4 h-[70vh]">
      {/* Message list */}
      <div className="w-80 shrink-0 border border-zinc-800 rounded-lg overflow-y-auto">
        {messages.map((msg: any) => (
          <button
            key={msg.id}
            onClick={() => setSelected(msg)}
            className={`w-full text-left px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors ${
              selected?.id === msg.id ? 'bg-zinc-800/70' : ''
            } ${!msg.read ? 'border-l-2 border-l-cyan-500' : ''}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono font-bold text-zinc-200 truncate">{msg.from_email}</span>
              {msg.interest_status && (
                <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${interestColors[msg.interest_status as InterestStatus]}`}>
                  {interestLabels[msg.interest_status as InterestStatus].split(' ')[0]}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 font-mono truncate">{msg.subject ?? '(ingen emnelinje)'}</p>
            <p className="text-xs text-zinc-600 font-mono mt-0.5">
              {new Date(msg.received_at).toLocaleDateString('nb-NO')}
            </p>
          </button>
        ))}
      </div>

      {/* Message detail */}
      <div className="flex-1 border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
        {selected ? (
          <>
            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900">
              <p className="font-mono text-sm font-bold text-zinc-100">{selected.from_email}</p>
              {selected.from_name && <p className="text-xs text-zinc-500 font-mono">{selected.from_name}</p>}
              <p className="text-xs text-zinc-400 font-mono mt-1">{selected.subject ?? '(ingen emnelinje)'}</p>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <pre className="text-sm text-zinc-300 font-mono whitespace-pre-wrap">{selected.body}</pre>
            </div>
            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900 flex gap-2">
              {(['interested', 'not_interested', 'wrong_contact'] as InterestStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => markInterest(selected.id, status)}
                  disabled={updating}
                  className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
                    selected.interest_status === status
                      ? interestColors[status]
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  {interestLabels[status]}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-zinc-600 font-mono text-sm">Velg en melding</p>
          </div>
        )}
      </div>
    </div>
  )
}
