import { supabaseAdmin } from '@/lib/supabase'
import UnsubscribeClient from '@/components/UnsubscribeClient'

export const revalidate = 0

async function getList() {
  const { data } = await supabaseAdmin
    .from('global_unsubscribes')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function UnsubscribePage() {
  const list = await getList()
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-mono font-bold" style={{ color: 'var(--text)' }}>Avmeldingsliste</h1>
        <p className="text-sm mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
          {list.length} adresser – disse får aldri e-post igjen
        </p>
      </div>
      <UnsubscribeClient list={list} />
    </div>
  )
}
