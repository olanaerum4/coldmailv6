import { supabaseAdmin } from '@/lib/supabase'
import AgentKeysClient from '@/components/AgentKeysClient'

export const revalidate = 0

async function getKeys() {
  const { data } = await supabaseAdmin
    .from('agent_keys')
    .select('id, name, last_used_at, created_at')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function AgentPage() {
  const keys = await getKeys()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://din-app.vercel.app'

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-mono font-bold" style={{ color: 'var(--text)' }}>Agent API</h1>
        <p className="text-sm mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
          Koble OpenClaw, n8n, eller andre agenter til OutreachOS
        </p>
      </div>

      {/* Quick start */}
      <div className="rounded-xl p-5 mb-6" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <h2 className="text-sm font-mono font-bold mb-3" style={{ color: '#1e40af' }}>OpenClaw-oppsett</h2>
        <p className="text-xs font-mono mb-3" style={{ color: '#1e3a8a' }}>
          Bruk dette i OpenClaw som en HTTP-tool:
        </p>
        <pre className="text-xs font-mono p-3 rounded-lg overflow-x-auto" style={{ background: '#1e3a8a', color: '#bfdbfe' }}>
{`# Hent uleste svar
POST ${appUrl}/api/agent
X-Agent-Key: <din-nøkkel>
{ "action": "get_inbox" }

# Legg til leads
POST ${appUrl}/api/agent
X-Agent-Key: <din-nøkkel>
{
  "action": "add_leads",
  "campaign_id": "<uuid>",
  "leads": [
    { "email": "test@firma.no", "name": "Ola", "company": "Firma AS" }
  ]
}

# Pause kampanje
POST ${appUrl}/api/agent
X-Agent-Key: <din-nøkkel>
{ "action": "pause_campaign", "campaign_id": "<uuid>" }`}
        </pre>
      </div>

      <AgentKeysClient keys={keys} />
    </div>
  )
}
