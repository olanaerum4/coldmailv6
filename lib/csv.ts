export interface CsvLead {
  email: string
  name?: string
  company?: string
  phone?: string
}

export function parseCsvLeads(csv: string): { leads: CsvLead[]; errors: string[] } {
  const lines = csv.trim().split(/\r?\n/)
  if (lines.length < 2) return { leads: [], errors: ['CSV har ingen rader med data'] }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''))

  const emailIdx = headers.indexOf('email')
  if (emailIdx === -1) return { leads: [], errors: ['CSV mangler "email" kolonne'] }

  const nameIdx = headers.indexOf('name')
  const companyIdx = headers.indexOf('company')
  const phoneIdx = headers.indexOf('phone')

  const leads: CsvLead[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const cols = parseCsvLine(line)
    const email = cols[emailIdx]?.replace(/['"]/g, '').trim()
    if (!email || !email.includes('@')) {
      errors.push(`Linje ${i + 1}: ugyldig e-post "${email}"`)
      continue
    }

    leads.push({
      email: email.toLowerCase(),
      name: nameIdx >= 0 ? cols[nameIdx]?.replace(/['"]/g, '').trim() || undefined : undefined,
      company: companyIdx >= 0 ? cols[companyIdx]?.replace(/['"]/g, '').trim() || undefined : undefined,
      phone: phoneIdx >= 0 ? cols[phoneIdx]?.replace(/['"]/g, '').trim() || undefined : undefined,
    })
  }

  return { leads, errors }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}
