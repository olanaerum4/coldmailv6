import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import EditCampaignClient from '@/components/EditCampaignClient'

export const revalidate = 0

async function getData(id: string) {
  const [{ data: campaign }, { data: sequences }] = await Promise.all([
    supabaseAdmin.from('campaigns').select('*').eq('id', id).single(),
    supabaseAdmin.from('sequences').select('*').eq('campaign_id', id).order('step_number'),
  ])
  return { campaign, sequences: sequences ?? [] }
}

export default async function EditCampaignPage({ params }: { params: { id: string } }) {
  const { campaign, sequences } = await getData(params.id)
  if (!campaign) notFound()
  return <EditCampaignClient campaign={campaign} initialSequences={sequences} />
}
