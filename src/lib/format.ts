const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' })
const euroShort = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

export function formatEuro(value: number, short = false): string {
  return (short ? euroShort : euro).format(value)
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const intervalLabels: Record<number, string> = {
  1: 'maandelijks',
  3: 'per kwartaal',
  6: 'per half jaar',
  12: 'jaarlijks',
}
