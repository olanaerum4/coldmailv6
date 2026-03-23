import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  // Fetch live context
  const [
    { data: campaigns },
    { data: deals },
    { data: projects },
    { data: inbox },
  ] = await Promise.all([
    supabaseAdmin.from('campaign_stats').select('*'),
    supabaseAdmin.from('deals').select('name,company,value,stage').limit(20),
    supabaseAdmin.from('founder_projects').select('name,mrr,customers,status'),
    supabaseAdmin.from('inbox_messages').select('id').eq('read', false),
  ])

  const context = `Du er en AI-assistent for en norsk gründer (Ola) som driver OutreachOS (cold email tool), LokalProfil.no (SMS/reviews SaaS for SMB), StartLokalt.no (webdesign) og Domene Flipping.

Nåværende data:
KAMPANJER: ${JSON.stringify(campaigns?.slice(0,5) ?? [])}
DEALS/PIPELINE: ${JSON.stringify(deals ?? [])}
PROSJEKTER: ${JSON.stringify(projects ?? [])}
ULESTE SVAR: ${inbox?.length ?? 0}

Svar på norsk. Vær konkret, praktisk og direkte. Fokuser på hva som gir mest inntekt. Bruk bullet points ved behov.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: context,
        messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      }),
    })

    const data = await res.json()
    const content = data.content?.[0]?.text ?? 'Ingen respons'
    return NextResponse.json({ content })
  } catch (e: any) {
    return NextResponse.json({ content: `Feil: ${e.message}` }, { status: 500 })
  }
}
