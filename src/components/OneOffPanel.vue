<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { accountName, store } from '../lib/store'
import { formatEuro, newId } from '../lib/format'
import { formatDate, todayIso } from '../lib/dates'
import ConfirmButton from './ConfirmButton.vue'
import type { Kind, OneOffItem } from '../lib/types'

const today = todayIso()
const editingId = ref<string | null>(null)
const showPast = ref(false)

function blank() {
  return { name: '', kind: 'expense' as Kind, amount: 0, accountId: store.accounts[0]?.id ?? '', date: today }
}
const form = reactive(blank())

function reset() {
  Object.assign(form, blank())
  editingId.value = null
}

function save() {
  if (!form.name.trim() || !form.accountId || !form.date) return
  const item: OneOffItem = {
    id: editingId.value ?? newId(),
    name: form.name.trim(),
    kind: form.kind,
    amount: Math.abs(Number(form.amount) || 0),
    accountId: form.accountId,
    date: form.date,
  }
  const index = store.oneOffs.findIndex((o) => o.id === item.id)
  if (index >= 0) store.oneOffs[index] = item
  else store.oneOffs.push(item)
  reset()
}

function edit(item: OneOffItem) {
  editingId.value = item.id
  Object.assign(form, item)
}

function remove(item: OneOffItem) {
  store.oneOffs = store.oneOffs.filter((o) => o.id !== item.id)
  if (editingId.value === item.id) reset()
}

const sorted = computed(() => [...store.oneOffs].sort((a, b) => a.date.localeCompare(b.date)))
const visible = computed(() => sorted.value.filter((o) => showPast.value || o.date >= today))
const pastCount = computed(() => sorted.value.length - sorted.value.filter((o) => o.date >= today).length)
</script>

<template>
  <section class="card">
    <h2>Eenmalige posten</h2>
    <p class="hint">Denk aan een vakantie, een nieuwe computer, een belastingteruggave of een bonus.</p>

    <table v-if="visible.length" class="table">
      <thead>
        <tr>
          <th>Datum</th>
          <th>Omschrijving</th>
          <th class="num">Bedrag</th>
          <th>Rekening</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="o in visible" :key="o.id" :class="{ muted: o.date < today, editing: o.id === editingId }">
          <td data-label="Datum">{{ formatDate(o.date) }}</td>
          <td data-label="Omschrijving">{{ o.name }}</td>
          <td data-label="Bedrag" class="num" :class="o.kind === 'income' ? 'positive' : 'negative'">
            {{ o.kind === 'income' ? '+' : '−' }} {{ formatEuro(o.amount) }}
          </td>
          <td data-label="Rekening">{{ accountName(o.accountId) }}</td>
          <td class="actions">
            <button @click="edit(o)">Bewerken</button>
            <ConfirmButton @confirm="remove(o)" />
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else class="empty">Geen geplande eenmalige posten.</p>
    <label v-if="pastCount" class="checkbox">
      <input v-model="showPast" type="checkbox" /> Toon {{ pastCount }} verlopen post(en)
    </label>
  </section>

  <section class="card">
    <h2>{{ editingId ? 'Eenmalige post bewerken' : 'Eenmalige post toevoegen' }}</h2>
    <p v-if="!store.accounts.length" class="empty">Voeg eerst een rekening toe.</p>
    <form v-else class="form-grid" @submit.prevent="save">
      <label>Soort
        <select v-model="form.kind">
          <option value="expense">Uitgave</option>
          <option value="income">Inkomsten</option>
        </select>
      </label>
      <label>Omschrijving<input v-model="form.name" placeholder="bijv. Vakantie Italië" required /></label>
      <label>Bedrag (€)<input v-model.number="form.amount" type="number" step="0.01" min="0" required /></label>
      <label>Datum<input v-model="form.date" type="date" required /></label>
      <label>Rekening
        <select v-model="form.accountId" required>
          <option v-for="a in store.accounts" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
      </label>
      <div class="form-actions">
        <button type="submit" class="primary">{{ editingId ? 'Opslaan' : 'Toevoegen' }}</button>
        <button v-if="editingId" type="button" @click="reset">Annuleren</button>
      </div>
    </form>
  </section>
</template>
