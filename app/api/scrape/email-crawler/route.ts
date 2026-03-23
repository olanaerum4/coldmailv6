import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
const SKIP_DOMAINS = ['sentry.io', 'example.com', 'wixpress.com', 'googleapis.com', 'schema.org', 'w3.org', 'cloudflare.com']
const CONTACT_PATHS = ['', '/kontakt', '/kontakt-oss', '/contact', '/about', '/om-oss', '/om', '/hjelp']

function cleanEmail(email: string): string {
  return email.toLowerCase().trim().replace(/[^a-z0-9._%+\-@]/g, '')
}

function isValidEmail(email: string): boolean {
  if (!email.includes('@')) return false
  const domain = email.split('@')[1]
  if (SKIP_DOMAINS.some(d => domain.includes(d))) return false
  if (domain.includes('.png') || domain.includes('.jpg') || domain.includes('.svg')) return false
  if (email.includes('..') || email.startsWith('.') || email.startsWith('@')) return false
  return email.length < 100
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OutreachBot/1.0)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

function extractEmails(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html)

  // Remove scripts and styles
  $('script, style, noscript').remove()

  const text = $.html()
  const found = new Set<string>()

  // From mailto: links
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    const email = cleanEmail(href.replace('mailto:', '').split('?')[0])
    if (isValidEmail(email)) found.add(email)
  })

  // From text content
  const matches = text.match(EMAIL_RE) ?? []
  for (const m of matches) {
    const email = cleanEmail(m)
    if (isValidEmail(email)) found.add(email)
  }

  return Array.from(found).slice(0, 5)
}

export async function POST(req: NextRequest) {
  const { websites } = await req.json() as { websites: { name: string; website: string; [key: string]: any }[] }

  if (!websites?.length) {
    return NextResponse.json({ error: 'Ingen nettsider oppgitt' }, { status: 400 })
  }

  const results = []

  for (const item of websites.slice(0, 30)) {
    let baseUrl = item.website
    if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`
    baseUrl = baseUrl.replace(/\/$/, '')

    const emails: string[] = []

    // Try contact pages first, then homepage
    for (const path of CONTACT_PATHS) {
      if (emails.length >= 2) break
      const html = await fetchPage(`${baseUrl}${path}`)
      if (!html) continue
      const found = extractEmails(html, baseUrl)
      for (const e of found) {
        if (!emails.includes(e)) emails.push(e)
      }
    }

    results.push({
      ...item,
      emails,
      primary_email: emails[0] ?? null,
    })
  }

  return NextResponse.json({ results, found: results.filter(r => r.primary_email).length })
}
