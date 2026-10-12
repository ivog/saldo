<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { accountName, store } from '../lib/store'
import { formatEuro, intervalLabels, newId } from '../lib/format'
import { formatMonth, monthOf, todayIso } from '../lib/dates'
import { monthlyEquivalent } from '../lib/forecast'
import type { Kind, RecurringItem } from '../lib/types'

const editingId = ref<string | null>(null)

function blank() {
  return {
    name: '',
    kind: 'expense' as Kind,
    amount: 0,
    accountId: store.accounts[0]?.id ?? '',
    dayOfMonth: 1,
    intervalMonths: 1,
    startMonth: monthOf(todayIso()),
    endMonth: '',
  }
}
const form = reactive(blank())

function reset() {
  Object.assign(form, blank())
  editingId.value = null
}

function save() {
  if (!form.name.trim() || !form.accountId) return
  const item: RecurringItem = {
    id: editingId.value ?? newId(),
    name: form.name.trim(),
    kind: form.kind,
    amount: Math.abs(Number(form.amount) || 0),
    accountId: form.accountId,
    dayOfMonth: Math.min(31, Math.max(1, Math.floor(Number(form.dayOfMonth) || 1))),
    intervalMonths: Number(form.intervalMonths) || 1,
    startMonth: form.startMonth || monthOf(todayIso()),
    endMonth: form.endMonth || undefined,
  }
  const index = store.recurring.findIndex((r) => r.id === item.id)
  if (index >= 0) store.recurring[index] = item
  else store.recurring.push(item)
  reset()
}

function edit(item: RecurringItem) {
  editingId.value = item.id
  Object.assign(form, { ...item, endMonth: item.endMonth ?? '' })
}

function remove(item: RecurringItem) {
  if (!confirm(`"${item.name}" verwijderen?`)) return
  store.recurring = store.recurring.filter((r) => r.id !== item.id)
  if (editingId.value === item.id) reset()
}

const currentMonth = monthOf(todayIso())
const isActive = (r: RecurringItem) => !r.endMonth || r.endMonth >= currentMonth

const groups = computed(() =>
  (['income', 'expense'] as Kind[]).map((kind) => {
    const items = store.recurring
      .filter((r) => r.kind === kind)
      .sort((a, b) => a.dayOfMonth - b.dayOfMonth || a.name.localeCompare(b.name))
    const perMonth = items.filter(isActive).reduce((s, r) => s + monthlyEquivalent(r), 0)
    return { kind, title: kind === 'income' ? 'Vaste inkomsten' : 'Vaste lasten', items, perMonth }
  }),
)

const netPerMonth = computed(() => groups.value[0].perMonth - groups.value[1].perMonth)

function period(r: RecurringItem) {
  if (r.endMonth) return `${formatMonth(r.startMonth)} – ${formatMonth(r.endMonth)}`
  return r.startMonth > currentMonth ? `vanaf ${formatMonth(r.startMonth)}` : 'doorlopend'
}
</script>

<template>
  <section class="card">
    <h2>Vaste inkomsten &amp; lasten</h2>

    <div class="summary">
      <div class="stat">
        <span>Inkomsten p/m</span><strong class="positive">{{ formatEuro(groups[0].perMonth) }}</strong>
      </div>
      <div class="stat">
        <span>Lasten p/m</span><strong class="negative">{{ formatEuro(groups[1].perMonth) }}</strong>
      </div>
      <div class="stat">
        <span>Netto p/m</span>
        <strong :class="netPerMonth >= 0 ? 'positive' : 'negative'">{{ formatEuro(netPerMonth) }}</strong>
      </div>
    </div>
    <p class="hint">Bedragen per kwartaal of jaar worden in deze samenvatting omgerekend naar een maandgemiddelde.</p>

    <template v-for="g in groups" :key="g.kind">
      <h3>{{ g.title }}</h3>
      <table v-if="g.items.length" class="table">
        <thead>
          <tr>
            <th>Omschrijving</th>
            <th class="num">Bedrag</th>
            <th>Frequentie</th>
            <th>Dag</th>
            <th>Rekening</th>
            <th>Periode</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in g.items" :key="r.id" :class="{ muted: !isActive(r), editing: r.id === editingId }">
            <td data-label="Omschrijving">{{ r.name }}</td>
            <td data-label="Bedrag" class="num">{{ formatEuro(r.amount) }}</td>
            <td data-label="Frequentie">{{ intervalLabels[r.intervalMonths] ?? `elke ${r.intervalMonths} mnd` }}</td>
            <td data-label="Dag">{{ r.dayOfMonth }}</td>
            <td data-label="Rekening">{{ accountName(r.accountId) }}</td>
            <td data-label="Periode">{{ period(r) }}</td>
            <td class="actions">
              <button @click="edit(r)">Bewerken</button>
              <button class="danger" @click="remove(r)">Verwijderen</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty">Nog niets ingevoerd.</p>
    </template>
  </section>

  <section class="card">
    <h2>{{ editingId ? 'Vaste post bewerken' : 'Vaste post toevoegen' }}</h2>
    <p v-if="!store.accounts.length" class="empty">Voeg eerst een rekening toe.</p>
    <form v-else class="form-grid" @submit.prevent="save">
      <label>Soort
        <select v-model="form.kind">
          <option value="income">Inkomsten</option>
          <option value="expense">Uitgave</option>
        </select>
      </label>
      <label>Omschrijving<input v-model="form.name" placeholder="bijv. Salaris, Huur, Zorgverzekering" required /></label>
      <label>Bedrag (€)<input v-model.number="form.amount" type="number" step="0.01" min="0" required /></label>
      <label>Rekening
        <select v-model="form.accountId" required>
          <option v-for="a in store.accounts" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
      </label>
      <label>Frequentie
        <select v-model.number="form.intervalMonths">
          <option v-for="(label, n) in intervalLabels" :key="n" :value="Number(n)">{{ label }}</option>
        </select>
      </label>
      <label>Dag van de maand<input v-model.number="form.dayOfMonth" type="number" min="1" max="31" required /></label>
      <label>Eerste maand<input v-model="form.startMonth" type="month" required /></label>
      <label>Laatste maand <small>(optioneel)</small><input v-model="form.endMonth" type="month" :min="form.startMonth" /></label>
      <div class="form-actions">
        <button type="submit" class="primary">{{ editingId ? 'Opslaan' : 'Toevoegen' }}</button>
        <button v-if="editingId" type="button" @click="reset">Annuleren</button>
      </div>
    </form>
  </section>
</template>
