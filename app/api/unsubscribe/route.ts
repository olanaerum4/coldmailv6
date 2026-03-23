import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get('lead')
  const email = req.nextUrl.searchParams.get('email')

  if (!leadId && !email) {
    return new NextResponse(buildPage('Ugyldig lenke', false), { headers: { 'Content-Type': 'text/html' } })
  }

  try {
    let leadEmail = email

    if (leadId) {
      const { data: lead } = await supabaseAdmin
        .from('leads')
        .select('email')
        .eq('id', leadId)
        .single()
      if (lead) leadEmail = lead.email

      await supabaseAdmin
        .from('leads')
        .update({ status: 'unsubscribed' })
        .eq('id', leadId)
    }

    if (leadEmail) {
      await supabaseAdmin
        .from('global_unsubscribes')
        .upsert({ email: leadEmail.toLowerCase(), reason: 'unsubscribe' }, { onConflict: 'email', ignoreDuplicates: true })
    }

    return new NextResponse(buildPage('Du er nå avmeldt og vil ikke motta flere e-poster fra oss.', true), {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch {
    return new NextResponse(buildPage('Noe gikk galt. Prøv igjen.', false), { headers: { 'Content-Type': 'text/html' } })
  }
}

function buildPage(message: string, success: boolean): string {
  const icon = success ? '✓' : '✗'
  const title = success ? 'Avmeldt' : 'Feil'
  return `<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Avmelding</title>
  <style>
    body { margin:0; font-family:-apple-system,sans-serif; background:#f8fafc; color:#0f172a; display:flex; align-items:center; justify-content:center; min-height:100vh; }
    .box { max-width:400px; padding:2.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:16px; text-align:center; box-shadow:0 4px 24px rgba(0,0,0,0.06); }
    .icon { font-size:2.5rem; margin-bottom:1rem; }
    h1 { font-size:1.25rem; font-weight:700; margin:0 0 0.75rem; }
    p { color:#64748b; font-size:0.875rem; line-height:1.6; margin:0; }
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`
}
