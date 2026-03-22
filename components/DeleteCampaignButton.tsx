'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteCampaignButton({ campaignId }: { campaignId: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/campaigns/${campaignId}`, { method: 'DELETE' })
    router.push('/campaigns')
    router.refresh()
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-zinc-400">Sikker?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-2 bg-red-600 text-white text-xs font-mono font-bold rounded hover:bg-red-500 transition-colors disabled:opacity-50"
        >
          {deleting ? 'Sletter...' : 'Ja, slett'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="px-3 py-2 bg-zinc-800 text-zinc-400 text-xs font-mono rounded hover:bg-zinc-700 transition-colors"
        >
          Avbryt
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="px-4 py-2 bg-zinc-800 text-zinc-400 text-sm font-mono rounded hover:bg-zinc-700 hover:text-red-400 transition-colors"
    >
      Slett
    </button>
  )
}
