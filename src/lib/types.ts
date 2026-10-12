export type Kind = 'income' | 'expense'

export interface Account {
  id: string
  name: string
  /** Saldo in euro's op de peildatum. */
  balance: number
  /** Peildatum van het saldo (YYYY-MM-DD). Alleen posten ná deze datum tellen mee in de prognose. */
  balanceDate: string
}

export interface RecurringItem {
  id: string
  name: string
  kind: Kind
  /** Altijd positief; `kind` bepaalt of het bij- of afgaat. */
  amount: number
  accountId: string
  /** Dag van de maand (1-31). Valt terug op de laatste dag bij kortere maanden. */
  dayOfMonth: number
  /** 1 = maandelijks, 3 = per kwartaal, 6 = halfjaarlijks, 12 = jaarlijks. */
  intervalMonths: number
  /** Eerste maand waarin de post voorkomt (YYYY-MM). */
  startMonth: string
  /** Optioneel: laatste maand waarin de post voorkomt (YYYY-MM). */
  endMonth?: string
}

export interface OneOffItem {
  id: string
  name: string
  kind: Kind
  amount: number
  accountId: string
  /** YYYY-MM-DD */
  date: string
}

export interface FinanceData {
  version: 1
  accounts: Account[]
  recurring: RecurringItem[]
  oneOffs: OneOffItem[]
}
