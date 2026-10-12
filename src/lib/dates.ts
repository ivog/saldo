// Datums worden overal als ISO-strings (YYYY-MM-DD / YYYY-MM) behandeld, zodat
// vergelijken met < en > werkt en er geen tijdzone-problemen ontstaan.

export function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function todayIso(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function monthOf(date: string): string {
  return date.slice(0, 7)
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number)
  const index = y * 12 + (m - 1) + n
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`
}

/** Aantal maanden van `from` naar `to` (beide YYYY-MM). */
export function monthDiff(from: string, to: string): number {
  const [fy, fm] = from.split('-').map(Number)
  const [ty, tm] = to.split('-').map(Number)
  return (ty - fy) * 12 + (tm - fm)
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

/** Datum op `day` in `month`, begrensd op de laatste dag van die maand. */
export function dateInMonth(month: string, day: number): string {
  return `${month}-${pad(Math.min(day, daysInMonth(month)))}`
}

export function lastDayOfMonth(month: string): string {
  return `${month}-${pad(daysInMonth(month))}`
}

const monthNames = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
const monthNamesLong = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
]

export function formatMonth(month: string, long = false): string {
  const [y, m] = month.split('-').map(Number)
  return `${(long ? monthNamesLong : monthNames)[m - 1]} ${y}`
}

export function formatDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return `${d} ${monthNames[m - 1]} ${y}`
}
