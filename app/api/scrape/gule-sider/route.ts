import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export interface GuleSiderResult {
  name: string
  address?: string
  phone?: string
  website?: string
  category?: string
}

export async function POST(req: NextRequest) {
  const { query, location, max = 20 } = await req.json()

  try {
    const searchTerm = encodeURIComponent(`${query}`)
    const locationTerm = encodeURIComponent(location || '')
    const url = `https://www.gulesider.no/${searchTerm}/${locationTerm}/bedrifter`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'no,nb;q=0.9,en;q=0.8',
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Gule Sider svarte med ${res.status}` }, { status: 400 })
    }

    const html = await res.text()
    const $ = cheerio.load(html)
    const results: GuleSiderResult[] = []

    // Parse result cards
    $('[class*="SearchResultItem"], [class*="result-item"], article').each((i, el) => {
      if (i >= max) return false

      const name = $(el).find('[class*="name"], [class*="title"], h2, h3').first().text().trim()
      if (!name) return

      const address = $(el).find('[class*="address"], [class*="street"]').first().text().trim()
      const phone = $(el).find('[class*="phone"], [href^="tel:"]').first()
        .text().trim().replace(/\s/g, '') ||
        $(el).find('[href^="tel:"]').attr('href')?.replace('tel:', '')
      const website = $(el).find('a[href*="http"]').filter((_, a) => {
        const href = $(a).attr('href') ?? ''
        return !href.includes('gulesider') && href.startsWith('http')
      }).attr('href')
      const category = $(el).find('[class*="category"], [class*="type"]').first().text().trim()

      results.push({ name, address, phone, website, category })
    })

    // Fallback: try alternative selectors if nothing found
    if (results.length === 0) {
      $('li, .hit, .listing').each((i, el) => {
        if (i >= max) return false
        const name = $(el).find('h2, h3, strong').first().text().trim()
        if (!name || name.length < 2) return
        const phone = $(el).find('[href^="tel:"]').attr('href')?.replace('tel:', '')
        results.push({ name, phone })
      })
    }

    return NextResponse.json({ results, total: results.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
