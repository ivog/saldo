<script setup lang="ts">
import { ref, watch } from 'vue'
import AccountsPanel from './components/AccountsPanel.vue'
import RecurringPanel from './components/RecurringPanel.vue'
import OneOffPanel from './components/OneOffPanel.vue'
import ForecastPanel from './components/ForecastPanel.vue'
import { parse, replaceData, store } from './lib/store'
import { todayIso } from './lib/dates'

const tabs = [
  { id: 'forecast', label: 'Prognose' },
  { id: 'accounts', label: 'Rekeningen' },
  { id: 'recurring', label: 'Vaste posten' },
  { id: 'oneoffs', label: 'Eenmalig' },
] as const
type TabId = (typeof tabs)[number]['id']

function initialTab(): TabId {
  const hash = location.hash.slice(1)
  if (tabs.some((t) => t.id === hash)) return hash as TabId
  return store.accounts.length ? 'forecast' : 'accounts'
}
const tab = ref<TabId>(initialTab())
watch(tab, (t) => history.replaceState(null, '', `#${t}`))

const fileInput = ref<HTMLInputElement>()

function exportData() {
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `saldo-${todayIso()}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

async function importData(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const data = parse(await file.text())
    if (confirm('Huidige gegevens vervangen door de inhoud van dit bestand?')) replaceData(data)
  } catch (err) {
    alert(`Importeren mislukt: ${(err as Error).message}`)
  } finally {
    ;(e.target as HTMLInputElement).value = ''
  }
}
</script>

<template>
  <header class="app-header">
    <div class="brand">
      <h1>Saldo</h1>
      <span>persoonlijke financiën &amp; prognose</span>
    </div>
    <div class="data-actions">
      <button title="Download een back-up als JSON" @click="exportData">Exporteren</button>
      <button title="Zet een back-up terug" @click="fileInput?.click()">Importeren</button>
      <input ref="fileInput" type="file" accept="application/json,.json" hidden @change="importData" />
    </div>
  </header>

  <nav class="tabs" role="tablist">
    <button
      v-for="t in tabs"
      :key="t.id"
      role="tab"
      :aria-selected="tab === t.id"
      :class="{ active: tab === t.id }"
      @click="tab = t.id"
    >
      {{ t.label }}
    </button>
  </nav>

  <main>
    <ForecastPanel v-if="tab === 'forecast'" />
    <AccountsPanel v-else-if="tab === 'accounts'" />
    <RecurringPanel v-else-if="tab === 'recurring'" />
    <OneOffPanel v-else-if="tab === 'oneoffs'" />
  </main>

  <footer class="app-footer">
    Je gegevens worden alleen lokaal in deze browser bewaard. Maak af en toe een export als back-up.
  </footer>
</template>
