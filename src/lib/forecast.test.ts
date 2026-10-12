import { describe, expect, it } from 'vitest'
import { buildForecast, monthlyEquivalent, occurrences } from './forecast'
import type { FinanceData, RecurringItem } from './types'

const base = (overrides: Partial<RecurringItem>): RecurringItem => ({
  id: 'r',
  name: 'Test',
  kind: 'expense',
  amount: 100,
  accountId: 'a',
  dayOfMonth: 1,
  intervalMonths: 1,
  startMonth: '2026-01',
  ...overrides,
})

describe('occurrences', () => {
  it('genereert maandelijkse datums en begrenst de dag op de maandlengte', () => {
    const item = base({ dayOfMonth: 31, startMonth: '2026-01' })
    expect(occurrences(item, '2026-01', '2026-04')).toEqual([
      '2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30',
    ])
  })

  it('respecteert interval, startmaand en eindmaand', () => {
    const item = base({ intervalMonths: 3, startMonth: '2025-11', endMonth: '2026-08' })
    expect(occurrences(item, '2026-01', '2026-12')).toEqual(['2026-02-01', '2026-05-01', '2026-08-01'])
  })

  it('start niet vóór de startmaand', () => {
    expect(occurrences(base({ startMonth: '2026-06' }), '2026-01', '2026-07')).toEqual([
      '2026-06-01', '2026-07-01',
    ])
  })
})

describe('buildForecast', () => {
  const data: FinanceData = {
    version: 1,
    accounts: [
      { id: 'a', name: 'Betaal', balance: 1000, balanceDate: '2026-10-12' },
      { id: 's', name: 'Spaar', balance: 5000, balanceDate: '2026-10-12' },
    ],
    recurring: [
      base({ id: 'salaris', kind: 'income', amount: 3000, dayOfMonth: 25, startMonth: '2026-01' }),
      base({ id: 'huur', amount: 1200.5, dayOfMonth: 1, startMonth: '2026-01' }),
      base({ id: 'sparen', kind: 'income', amount: 200, accountId: 's', dayOfMonth: 26 }),
    ],
    oneOffs: [
      { id: 'pc', name: 'Computer', kind: 'expense', amount: 1500, accountId: 'a', date: '2026-12-10' },
    ],
  }

  it('telt alleen posten na de peildatum mee', () => {
    const f = buildForecast(data, '2026-10-12', 2)
    // Oktober: huur van 1 okt is al geweest, salaris en sparen nog niet.
    expect(f.months[0].month).toBe('2026-10')
    expect(f.months[0].balances).toEqual({ a: 4000, s: 5200 })
    // November: + salaris − huur, + sparen
    expect(f.months[1].balances).toEqual({ a: 5799.5, s: 5400 })
    // December: ook nog de computer
    expect(f.months[2].balances).toEqual({ a: 6099, s: 5600 })
    expect(f.months[2].expense).toBe(2700.5)
    expect(f.months[2].total).toBe(11699)
  })

  it('verwerkt posten tussen een oude peildatum en vandaag in het startsaldo', () => {
    const old: FinanceData = {
      ...data,
      accounts: [{ id: 'a', name: 'Betaal', balance: 1000, balanceDate: '2026-08-31' }],
      recurring: [base({ id: 'huur', amount: 100, dayOfMonth: 1 })],
      oneOffs: [],
    }
    const f = buildForecast(old, '2026-10-12', 1)
    expect(f.startTotal).toBe(900) // huur 1 sep
    expect(f.months[0].total).toBe(800) // huur 1 okt
    expect(f.months[1].total).toBe(700)
  })

  it('vindt het laagste punt', () => {
    const f = buildForecast(data, '2026-10-12', 3)
    expect(f.lowest).toEqual({ date: '2026-10-12', total: 6000 })
    const tight = buildForecast(
      { ...data, oneOffs: [{ ...data.oneOffs[0], amount: 20000 }] },
      '2026-10-12',
      3,
    )
    expect(tight.lowest.date).toBe('2026-12-10')
  })
})

it('monthlyEquivalent', () => {
  expect(monthlyEquivalent(base({ amount: 120, intervalMonths: 12 }))).toBe(10)
})
