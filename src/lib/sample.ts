import type { FinanceData } from './types'
import { addMonths, monthOf } from './dates'

/** Voorbeeldgegevens voor een eerste bezoek, met datums relatief aan vandaag. */
export function sampleData(today: string): FinanceData {
  const month = monthOf(today)
  const yearStart = `${today.slice(0, 4)}-01`
  return {
    version: 1,
    isExample: true,
    accounts: [
      { id: 'ex-betaal', name: 'Betaalrekening', balance: 1850.4, balanceDate: today },
      { id: 'ex-spaar', name: 'Spaarrekening', balance: 6200, balanceDate: today },
    ],
    recurring: [
      { id: 'ex-salaris', name: 'Salaris', kind: 'income', amount: 3250, accountId: 'ex-betaal', dayOfMonth: 24, intervalMonths: 1, startMonth: yearStart },
      { id: 'ex-huur', name: 'Huur', kind: 'expense', amount: 1295, accountId: 'ex-betaal', dayOfMonth: 1, intervalMonths: 1, startMonth: yearStart },
      { id: 'ex-boodschappen', name: 'Boodschappen', kind: 'expense', amount: 550, accountId: 'ex-betaal', dayOfMonth: 5, intervalMonths: 1, startMonth: yearStart },
      { id: 'ex-zorg', name: 'Zorgverzekering', kind: 'expense', amount: 148.5, accountId: 'ex-betaal', dayOfMonth: 1, intervalMonths: 1, startMonth: yearStart },
      { id: 'ex-auto', name: 'Autoverzekering', kind: 'expense', amount: 420, accountId: 'ex-betaal', dayOfMonth: 15, intervalMonths: 12, startMonth: addMonths(month, 5) },
      { id: 'ex-sparen-af', name: 'Naar spaarrekening', kind: 'expense', amount: 300, accountId: 'ex-betaal', dayOfMonth: 25, intervalMonths: 1, startMonth: yearStart },
      { id: 'ex-sparen-bij', name: 'Van betaalrekening', kind: 'income', amount: 300, accountId: 'ex-spaar', dayOfMonth: 25, intervalMonths: 1, startMonth: yearStart },
    ],
    oneOffs: [
      { id: 'ex-pc', name: 'Nieuwe computer', kind: 'expense', amount: 1800, accountId: 'ex-betaal', date: `${addMonths(month, 2)}-02` },
      { id: 'ex-vakantie', name: 'Zomervakantie', kind: 'expense', amount: 2400, accountId: 'ex-spaar', date: `${addMonths(month, 9)}-10` },
      { id: 'ex-belasting', name: 'Belastingteruggave', kind: 'income', amount: 640, accountId: 'ex-betaal', date: `${addMonths(month, 6)}-01` },
    ],
  }
}
