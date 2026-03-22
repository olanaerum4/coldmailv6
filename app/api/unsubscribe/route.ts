import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get('lead')

  if (!leadId) {
    return new NextResponse(unsubPage('Ugyldig lenke', false), { headers: { 'Content-Type': 'text/html' } })
  }

  const { error } = await supabaseAdmin
    .from('leads')
    .update({ status: 'unsubscribed' })
    .eq('id', leadId)

  if (error) {
    return new NextResponse(unsubPage('Noe gikk galt. Prøv igjen.', false), { headers: { 'Content-Type': 'text/html' } })
  }

  return new NextResponse(unsubPage('Du er nå avmeldt og vil ikke motta flere e-poster.', true), {
    headers: { 'Content-Type': 'text/html' },
  })
}

function unsubPage(message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Avmelding</title>
  <style>
    body { margin: 0; font-family: -apple-system, sans-serif; background: #09090b; color: #fafafa; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .box { max-width: 400px; padding: 2.5rem; background: #18181b; border: 1px solid #27272a; border-radius: 12px; text-align: center; }
    .icon { font-size: 2.5rem; margin-bottom: 1rem; }
    h1 { font-size: 1.25rem; font-weight: 700; margin: 0 0 0.75rem; }
    p { color: #a1a1aa; font-size: 0.875rem; line-height: 1.6; margin: 0; }
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">${success ? '✓' : '✗'}</div>
    <h1>${success ? 'Avmeldt' : 'Feil'}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`
}
