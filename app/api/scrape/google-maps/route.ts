import { NextRequest, NextResponse } from 'next/server'

export interface PlacesResult {
  name: string
  address: string
  phone?: string
  website?: string
  category?: string
  rating?: number
  place_id: string
}

export async function POST(req: NextRequest) {
  const { query, location, radius = 10000, max = 20 } = await req.json()

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY ikke satt i miljøvariabler' }, { status: 500 })
  }

  try {
    // Text Search
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
    searchUrl.searchParams.set('query', `${query} ${location}`)
    searchUrl.searchParams.set('language', 'no')
    searchUrl.searchParams.set('region', 'no')
    searchUrl.searchParams.set('key', apiKey)

    const searchRes = await fetch(searchUrl.toString())
    const searchData = await searchRes.json()

    if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
      return NextResponse.json({ error: `Google API feil: ${searchData.status} – ${searchData.error_message ?? ''}` }, { status: 400 })
    }

    const places: PlacesResult[] = []
    const results = (searchData.results ?? []).slice(0, max)

    // Fetch details for each place (phone + website)
    for (const place of results) {
      const detailUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json')
      detailUrl.searchParams.set('place_id', place.place_id)
      detailUrl.searchParams.set('fields', 'name,formatted_phone_number,website,formatted_address,types')
      detailUrl.searchParams.set('language', 'no')
      detailUrl.searchParams.set('key', apiKey)

      const detailRes = await fetch(detailUrl.toString())
      const detailData = await detailRes.json()
      const d = detailData.result ?? {}

      places.push({
        name: d.name ?? place.name,
        address: d.formatted_address ?? place.formatted_address ?? '',
        phone: d.formatted_phone_number,
        website: d.website,
        category: (d.types ?? place.types ?? [])[0]?.replace(/_/g, ' '),
        rating: place.rating,
        place_id: place.place_id,
      })
    }

    return NextResponse.json({ results: places, total: places.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
