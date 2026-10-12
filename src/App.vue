<script setup lang="ts">
import { ref, watch } from 'vue'
import AccountsPanel from './components/AccountsPanel.vue'
import RecurringPanel from './components/RecurringPanel.vue'
import OneOffPanel from './components/OneOffPanel.vue'
import ForecastPanel from './components/ForecastPanel.vue'
import BackupPanel from './components/BackupPanel.vue'
import { clearData, store } from './lib/store'

const tabs = [
  { id: 'forecast', label: 'Prognose' },
  { id: 'accounts', label: 'Rekeningen' },
  { id: 'recurring', label: 'Vaste posten' },
  { id: 'oneoffs', label: 'Eenmalig' },
  { id: 'backup', label: 'Back-up' },
] as const
type TabId = (typeof tabs)[number]['id']

function initialTab(): TabId {
  const hash = location.hash.slice(1)
  if (tabs.some((t) => t.id === hash)) return hash as TabId
  return store.accounts.length ? 'forecast' : 'accounts'
}
const tab = ref<TabId>(initialTab())
watch(tab, (t) => {
  try {
    history.replaceState(null, '', `#${t}`)
  } catch {
    // Niet toegestaan in sommige ingesloten omgevingen; het tabblad werkt dan gewoon zonder URL.
  }
})

function startFresh() {
  clearData()
  tab.value = 'accounts'
}
</script>

<template>
  <header class="app-header">
    <h1>Saldo</h1>
    <span>persoonlijke financiën &amp; prognose</span>
  </header>

  <div v-if="store.isExample" class="example-banner">
    <p><strong>Voorbeeldgegevens.</strong> Kijk gerust rond; dit zijn niet jouw cijfers.</p>
    <div class="form-actions">
      <button type="button" class="primary" @click="startFresh">Wissen en zelf beginnen</button>
      <button type="button" @click="store.isExample = false">Als startpunt houden</button>
    </div>
  </div>

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
    <BackupPanel v-else-if="tab === 'backup'" />
  </main>

  <footer class="app-footer">
    Je gegevens worden alleen in deze browser bewaard. Maak af en toe een back-up.
  </footer>
</template>
