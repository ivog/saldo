import { reactive, watch } from 'vue'
import type { FinanceData } from './types'
import { sampleData } from './sample'
import { todayIso } from './dates'

const STORAGE_KEY = 'saldo.data.v1'

function load(): FinanceData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return parse(raw)
  } catch {
    // Corrupte of ontoegankelijke opslag: begin met voorbeeldgegevens.
  }
  return sampleData(todayIso())
}

export function parse(json: string): FinanceData {
  const data = JSON.parse(json)
  if (!data || !Array.isArray(data.accounts) || !Array.isArray(data.recurring) || !Array.isArray(data.oneOffs)) {
    throw new Error('Ongeldig bestand: accounts, recurring of oneOffs ontbreekt.')
  }
  return { version: 1, accounts: data.accounts, recurring: data.recurring, oneOffs: data.oneOffs }
}

/** Gedeelde, reactieve state; wordt automatisch in localStorage bewaard. */
export const store = reactive<FinanceData>(load())

watch(
  store,
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      // Opslaan mislukt (bijv. private modus); de app blijft werken in het geheugen.
    }
  },
  { deep: true },
)

export function replaceData(data: FinanceData) {
  store.accounts = data.accounts
  store.recurring = data.recurring
  store.oneOffs = data.oneOffs
  store.isExample = data.isExample ?? false
}

export function clearData() {
  replaceData({ version: 1, accounts: [], recurring: [], oneOffs: [] })
}

export function removeAccount(id: string) {
  store.accounts = store.accounts.filter((a) => a.id !== id)
  store.recurring = store.recurring.filter((r) => r.accountId !== id)
  store.oneOffs = store.oneOffs.filter((o) => o.accountId !== id)
}

export function accountName(id: string): string {
  return store.accounts.find((a) => a.id === id)?.name ?? '—'
}
