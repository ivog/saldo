<script setup lang="ts">
import { computed, ref } from 'vue'
import { accountName, store } from '../lib/store'
import { buildForecast } from '../lib/forecast'
import { formatDate, formatMonth, todayIso } from '../lib/dates'
import { formatEuro } from '../lib/format'
import BalanceChart from './BalanceChart.vue'

const today = todayIso()
const monthsAhead = ref(12)
const accountFilter = ref<string>('all')
const expanded = ref<string | null>(null)

const forecast = computed(() => buildForecast(store, today, monthsAhead.value))

const isAll = computed(() => accountFilter.value === 'all' || !store.accounts.some((a) => a.id === accountFilter.value))

// Maandrijen, eventueel gefilterd op één rekening.
const rows = computed(() =>
  forecast.value.months.map((m) => {
    const events = isAll.value ? m.events : m.events.filter((e) => e.accountId === accountFilter.value)
    const income = events.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0)
    const expense = events.filter((e) => e.amount < 0).reduce((s, e) => s - e.amount, 0)
    return {
      ...m,
      events,
      income,
      expense,
      net: income - expense,
      value: isAll.value ? m.total : m.balances[accountFilter.value],
    }
  }),
)

const start = computed(() => {
  if (isAll.value) return forecast.value.startTotal
  // Startsaldo = eindsaldo eerste maand minus de mutaties in die maand.
  const first = rows.value[0]
  return first.value - first.net
})

const end = computed(() => rows.value[rows.value.length - 1]?.value ?? 0)
const lowestRow = computed(() => rows.value.reduce((lo, r) => (r.value < lo.value ? r : lo), rows.value[0]))

const chartPoints = computed(() => [
  { label: 'nu', value: start.value },
  ...rows.value.map((r) => ({ label: formatMonth(r.month).replace(/ (\d\d)(\d\d)$/, " '$2"), value: r.value })),
])

function toggle(month: string) {
  expanded.value = expanded.value === month ? null : month
}
</script>

<template>
  <section class="card">
    <div class="toolbar">
      <h2>Prognose</h2>
      <label>Periode
        <select v-model.number="monthsAhead">
          <option :value="3">3 maanden</option>
          <option :value="6">6 maanden</option>
          <option :value="12">1 jaar</option>
          <option :value="24">2 jaar</option>
          <option :value="36">3 jaar</option>
          <option :value="60">5 jaar</option>
        </select>
      </label>
      <label>Rekening
        <select v-model="accountFilter">
          <option value="all">Alle rekeningen</option>
          <option v-for="a in store.accounts" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
      </label>
    </div>

    <p v-if="!store.accounts.length" class="empty">
      Voeg eerst een rekening toe onder <strong>Rekeningen</strong>; daarna verschijnt hier je prognose.
    </p>

    <template v-else>
      <div class="summary">
        <div class="stat">
          <span>Nu</span>
          <strong :class="{ negative: start < 0 }">{{ formatEuro(start) }}</strong>
        </div>
        <div class="stat">
          <span>Eind {{ formatMonth(rows[rows.length - 1].month, true) }}</span>
          <strong :class="{ negative: end < 0 }">{{ formatEuro(end) }}</strong>
        </div>
        <div class="stat">
          <span>Verschil</span>
          <strong :class="end - start >= 0 ? 'positive' : 'negative'">
            {{ end - start >= 0 ? '+' : '' }}{{ formatEuro(end - start) }}
          </strong>
        </div>
        <div class="stat">
          <span>Laagste maandeinde</span>
          <strong :class="{ negative: lowestRow.value < 0 }">{{ formatEuro(lowestRow.value) }}</strong>
          <small>{{ formatMonth(lowestRow.month, true) }}</small>
        </div>
      </div>

      <p v-if="isAll && forecast.lowest.total < 0" class="warning">
        Let op: je totale saldo komt op {{ formatDate(forecast.lowest.date) }} onder nul
        ({{ formatEuro(forecast.lowest.total) }}).
      </p>
      <p v-else-if="!isAll && lowestRow.value < 0" class="warning">
        Let op: deze rekening staat eind {{ formatMonth(lowestRow.month, true) }} rood.
      </p>

      <BalanceChart :points="chartPoints" />

      <div class="table-scroll">
        <table class="table forecast">
          <thead>
            <tr>
              <th>Maand</th>
              <th class="num">Inkomsten</th>
              <th class="num">Uitgaven</th>
              <th class="num">Netto</th>
              <template v-if="isAll && store.accounts.length > 1">
                <th v-for="a in store.accounts" :key="a.id" class="num">{{ a.name }}</th>
              </template>
              <th class="num">{{ isAll ? 'Totaal' : 'Saldo' }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="r in rows" :key="r.month">
              <tr class="clickable" :class="{ open: expanded === r.month }" @click="toggle(r.month)">
                <td>
                  <span class="caret">{{ expanded === r.month ? '▾' : '▸' }}</span>
                  {{ formatMonth(r.month, true) }}
                </td>
                <td class="num positive">{{ formatEuro(r.income) }}</td>
                <td class="num negative">{{ formatEuro(r.expense) }}</td>
                <td class="num" :class="r.net >= 0 ? 'positive' : 'negative'">{{ formatEuro(r.net) }}</td>
                <template v-if="isAll && store.accounts.length > 1">
                  <td v-for="a in store.accounts" :key="a.id" class="num" :class="{ negative: r.balances[a.id] < 0 }">
                    {{ formatEuro(r.balances[a.id]) }}
                  </td>
                </template>
                <td class="num strong" :class="{ negative: r.value < 0 }">{{ formatEuro(r.value) }}</td>
              </tr>
              <tr v-if="expanded === r.month" class="details">
                <td :colspan="5 + (isAll && store.accounts.length > 1 ? store.accounts.length : 0)">
                  <ul v-if="r.events.length">
                    <li v-for="(e, i) in r.events" :key="i">
                      <span class="date">{{ formatDate(e.date) }}</span>
                      <span class="name">
                        {{ e.name }}
                        <small v-if="e.source === 'oneOff'" class="tag">eenmalig</small>
                        <small v-if="isAll" class="account">{{ accountName(e.accountId) }}</small>
                      </span>
                      <span class="num" :class="e.amount >= 0 ? 'positive' : 'negative'">
                        {{ e.amount >= 0 ? '+' : '−' }} {{ formatEuro(Math.abs(e.amount)) }}
                      </span>
                    </li>
                  </ul>
                  <p v-else class="empty">Geen posten in deze maand (na de peildatum).</p>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
