import type { Account, FinanceData, Kind, RecurringItem } from './types'
import { addMonths, dateInMonth, lastDayOfMonth, monthDiff, monthOf } from './dates'

export interface ForecastEvent {
  date: string
  name: string
  kind: Kind
  /** Getekend bedrag: positief voor inkomsten, negatief voor uitgaven. */
  amount: number
  accountId: string
  source: 'recurring' | 'oneOff'
  sourceId: string
}

export interface ForecastMonth {
  month: string
  income: number
  expense: number
  net: number
  /** Saldo per rekening aan het eind van de maand. */
  balances: Record<string, number>
  total: number
  events: ForecastEvent[]
}

export interface Forecast {
  startTotal: number
  months: ForecastMonth[]
  /** Laagste totaalsaldo binnen de periode, met de datum waarop dat optreedt. */
  lowest: { date: string; total: number }
}

// Rekenen in centen voorkomt afrondingsfouten bij optellen.
const toCents = (euro: number) => Math.round(euro * 100)
const toEuro = (cents: number) => cents / 100

/** Alle datums waarop een vaste post valt binnen [fromMonth, toMonth]. */
export function occurrences(item: RecurringItem, fromMonth: string, toMonth: string): string[] {
  const interval = Math.max(1, Math.floor(item.intervalMonths || 1))
  const last = item.endMonth && item.endMonth < toMonth ? item.endMonth : toMonth
  let month = item.startMonth
  if (month < fromMonth) {
    // Spring direct naar de eerste occurrence op of na fromMonth.
    const steps = Math.ceil(monthDiff(month, fromMonth) / interval)
    month = addMonths(month, steps * interval)
  }
  const result: string[] = []
  for (; month <= last; month = addMonths(month, interval)) {
    result.push(dateInMonth(month, item.dayOfMonth))
  }
  return result
}

/**
 * Berekent het verwachte saldo per rekening aan het eind van elke maand,
 * vanaf de maand van `today` tot en met `monthsAhead` maanden vooruit.
 *
 * Per rekening tellen alleen posten mee die ná de peildatum van het saldo vallen;
 * zo blijft de prognose kloppen als je je saldo een tijdje niet bijwerkt.
 */
export function buildForecast(data: FinanceData, today: string, monthsAhead: number): Forecast {
  const accounts = new Map<string, Account>(data.accounts.map((a) => [a.id, a]))
  const firstMonth = monthOf(today)
  const lastMonth = addMonths(firstMonth, monthsAhead)
  const horizon = lastDayOfMonth(lastMonth)

  const events: ForecastEvent[] = []
  const counts = (accountId: string, date: string) => {
    const account = accounts.get(accountId)
    return !!account && date > account.balanceDate && date <= horizon
  }

  // Vroegste peildatum bepaalt vanaf welke maand we occurrences moeten genereren.
  const earliestMonth = data.accounts.reduce(
    (min, a) => (monthOf(a.balanceDate) < min ? monthOf(a.balanceDate) : min),
    firstMonth,
  )

  for (const item of data.recurring) {
    for (const date of occurrences(item, earliestMonth, lastMonth)) {
      if (!counts(item.accountId, date)) continue
      events.push({
        date,
        name: item.name,
        kind: item.kind,
        amount: item.kind === 'income' ? item.amount : -item.amount,
        accountId: item.accountId,
        source: 'recurring',
        sourceId: item.id,
      })
    }
  }
  for (const item of data.oneOffs) {
    if (!counts(item.accountId, item.date)) continue
    events.push({
      date: item.date,
      name: item.name,
      kind: item.kind,
      amount: item.kind === 'income' ? item.amount : -item.amount,
      accountId: item.accountId,
      source: 'oneOff',
      sourceId: item.id,
    })
  }
  events.sort((a, b) => a.date.localeCompare(b.date) || a.amount - b.amount)

  const balances = new Map<string, number>(data.accounts.map((a) => [a.id, toCents(a.balance)]))
  const sumBalances = () => [...balances.values()].reduce((s, v) => s + v, 0)

  // Posten van vóór deze maand (tussen een oude peildatum en vandaag) verwerken we
  // in het startsaldo, zodat de eerste rij echt "nu" weerspiegelt.
  let i = 0
  for (; i < events.length && monthOf(events[i].date) < firstMonth; i++) {
    balances.set(events[i].accountId, balances.get(events[i].accountId)! + toCents(events[i].amount))
  }
  const startTotal = sumBalances()
  let lowest = { date: today, total: startTotal }

  const months: ForecastMonth[] = []
  for (let m = 0; m <= monthsAhead; m++) {
    const month = addMonths(firstMonth, m)
    const monthEvents: ForecastEvent[] = []
    let income = 0
    let expense = 0
    for (; i < events.length && monthOf(events[i].date) === month; i++) {
      const e = events[i]
      const cents = toCents(e.amount)
      balances.set(e.accountId, balances.get(e.accountId)! + cents)
      if (cents >= 0) income += cents
      else expense -= cents
      monthEvents.push(e)
      const total = sumBalances()
      if (total < lowest.total) lowest = { date: e.date, total }
    }
    months.push({
      month,
      income: toEuro(income),
      expense: toEuro(expense),
      net: toEuro(income - expense),
      balances: Object.fromEntries([...balances].map(([id, c]) => [id, toEuro(c)])),
      total: toEuro(sumBalances()),
      events: monthEvents,
    })
  }

  return {
    startTotal: toEuro(startTotal),
    months,
    lowest: { date: lowest.date, total: toEuro(lowest.total) },
  }
}

/** Gemiddeld maandbedrag van een vaste post (bijv. jaarlijks € 120 → € 10 p/m). */
export function monthlyEquivalent(item: RecurringItem): number {
  return item.amount / Math.max(1, item.intervalMonths || 1)
}
