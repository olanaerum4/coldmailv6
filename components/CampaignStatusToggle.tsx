'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Campaign, CampaignStatus } from '@/types'

const transitions: Record<CampaignStatus, { next: CampaignStatus; label: string; cls: string } | null> = {
  draft:     { next: 'active',  label: 'Aktiver',    cls: 'bg-cyan-500 text-black hover:bg-cyan-400' },
  active:    { next: 'paused',  label: 'Pause',      cls: 'bg-amber-500 text-black hover:bg-amber-400' },
  paused:    { next: 'active',  label: 'Gjenoppta',  cls: 'bg-emerald-500 text-black hover:bg-emerald-400' },
  completed: null,
}

export default function CampaignStatusToggle({ campaign }: { campaign: Campaign }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const transition = transitions[campaign.status]

  if (!transition) return null

  async function handleToggle() {
    setLoading(true)
    await fetch(`/api/campaigns/${campaign.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: transition!.next }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-4 py-2 text-sm font-mono font-bold rounded transition-colors disabled:opacity-50 ${transition.cls}`}
    >
      {loading ? '...' : transition.label}
    </button>
  )
}
