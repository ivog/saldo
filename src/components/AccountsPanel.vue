<script setup lang="ts">
import { computed, reactive } from 'vue'
import { removeAccount, store } from '../lib/store'
import { formatEuro, newId } from '../lib/format'
import { todayIso } from '../lib/dates'

const form = reactive({ name: '', balance: 0, balanceDate: todayIso() })

const total = computed(() => store.accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0))

function add() {
  if (!form.name.trim()) return
  store.accounts.push({
    id: newId(),
    name: form.name.trim(),
    balance: Number(form.balance) || 0,
    balanceDate: form.balanceDate || todayIso(),
  })
  form.name = ''
  form.balance = 0
  form.balanceDate = todayIso()
}

function remove(id: string, name: string) {
  const linked =
    store.recurring.filter((r) => r.accountId === id).length +
    store.oneOffs.filter((o) => o.accountId === id).length
  const extra = linked ? `\n\nDaarmee worden ook ${linked} gekoppelde post(en) verwijderd.` : ''
  if (confirm(`Rekening "${name}" verwijderen?${extra}`)) removeAccount(id)
}
</script>

<template>
  <section class="card">
    <h2>Rekeningen</h2>
    <p class="hint">
      Vul per rekening het huidige saldo in. De <em>peildatum</em> is de datum waarop dat saldo klopte;
      alleen posten na die datum tellen mee in de prognose. Werk het saldo af en toe bij met de stand van je bank.
    </p>

    <table v-if="store.accounts.length" class="table">
      <thead>
        <tr>
          <th>Naam</th>
          <th class="num">Saldo</th>
          <th>Peildatum</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="a in store.accounts" :key="a.id">
          <td data-label="Naam"><input v-model="a.name" aria-label="Naam" /></td>
          <td data-label="Saldo" class="num">
            <input v-model.number="a.balance" type="number" step="0.01" aria-label="Saldo" class="num" />
          </td>
          <td data-label="Peildatum">
            <input v-model="a.balanceDate" type="date" aria-label="Peildatum" />
            <button v-if="a.balanceDate !== todayIso()" class="link" @click="a.balanceDate = todayIso()">vandaag</button>
          </td>
          <td class="actions">
            <button class="danger" @click="remove(a.id, a.name)">Verwijderen</button>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th>Totaal</th>
          <th class="num" :class="{ negative: total < 0 }">{{ formatEuro(total) }}</th>
          <th colspan="2"></th>
        </tr>
      </tfoot>
    </table>
    <p v-else class="empty">Nog geen rekeningen. Voeg hieronder je eerste rekening toe.</p>

    <form class="form-row" @submit.prevent="add">
      <label>Naam<input v-model="form.name" placeholder="bijv. Betaalrekening" required /></label>
      <label>Saldo (€)<input v-model.number="form.balance" type="number" step="0.01" /></label>
      <label>Peildatum<input v-model="form.balanceDate" type="date" required /></label>
      <button type="submit" class="primary">Rekening toevoegen</button>
    </form>
  </section>
</template>
