export function pct(part: number, total: number): string {
  if (!total) return '0%'
  return `${Math.round((part / total) * 100)}%`
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'text-zinc-400',
    active: 'text-blue-400',
    replied: 'text-emerald-400',
    bounced: 'text-red-400',
    unsubscribed: 'text-orange-400',
    draft: 'text-zinc-400',
    paused: 'text-amber-400',
    completed: 'text-emerald-400',
  }
  return map[status] ?? 'text-zinc-400'
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Ikke kontaktet',
    active: 'Sekvens aktiv',
    replied: 'Svart',
    bounced: 'Avvist',
    unsubscribed: 'Avmeldt',
    draft: 'Utkast',
    paused: 'Pauset',
    completed: 'Fullført',
  }
  return map[status] ?? status
}
