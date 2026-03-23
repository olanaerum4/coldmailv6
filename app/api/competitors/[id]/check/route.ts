import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendTelegram } from '@/lib/telegram'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data: competitor } = await supabaseAdmin.from('competitors').select('*').eq('id', params.id).single()
  if (!competitor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const res = await fetch(competitor.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OutreachBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    const html = await res.text()
    // Simple content fingerprint – strip tags, normalize whitespace
    const content = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000)

    const prevContent = competitor.last_content
    let changed = false
    let summary = ''

    if (prevContent && prevContent !== content) {
      changed = true
      // Use AI to summarize the change
      try {
        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY ?? '', 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 200,
            messages: [{ role: 'user', content: `Sammenlign disse to nettside-versjonene og beskriv hva som er endret på 1-2 setninger på norsk:\n\nFØR:\n${prevContent.slice(0,2000)}\n\nETTER:\n${content.slice(0,2000)}` }],
          }),
        })
        const aiData = await aiRes.json()
        summary = aiData.content?.[0]?.text ?? 'Innholdet har endret seg.'
      } catch {
        summary = 'Innholdet på nettsiden har endret seg.'
      }

      await supabaseAdmin.from('competitor_changes').insert({ competitor_id: competitor.id, summary })
      await sendTelegram(`📰 <b>Konkurrent-endring: ${competitor.name}</b>\n\n${summary}\n\n<a href="${competitor.url}">${competitor.url}</a>`)
    }

    await supabaseAdmin.from('competitors').update({ last_content: content, last_checked_at: new Date().toISOString() }).eq('id', params.id)
    return NextResponse.json({ changed, summary })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
