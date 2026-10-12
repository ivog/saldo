<script setup lang="ts">
import { computed, ref } from 'vue'
import { clearData, parse, replaceData, store } from '../lib/store'
import ConfirmButton from './ConfirmButton.vue'

const exportJson = computed(() => JSON.stringify(store, null, 2))
const copied = ref(false)
const exportBox = ref<HTMLTextAreaElement>()

async function copy() {
  try {
    await navigator.clipboard.writeText(exportJson.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    exportBox.value?.select()
  }
}

const importText = ref('')
const message = ref<{ ok: boolean; text: string } | null>(null)

function restore() {
  try {
    replaceData(parse(importText.value))
    importText.value = ''
    message.value = { ok: true, text: 'Back-up teruggezet.' }
  } catch (err) {
    message.value = { ok: false, text: `Terugzetten mislukt: ${(err as Error).message} Controleer of je de volledige tekst hebt geplakt.` }
  }
}

async function readFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) importText.value = await file.text()
  input.value = ''
}
</script>

<template>
  <section class="card">
    <h2>Back-up maken</h2>
    <p class="hint">
      Je gegevens staan alleen in deze browser. Kopieer de tekst hieronder en bewaar hem (bijv. in een notitie of als
      <code>.json</code>-bestand) om later terug te zetten of naar een andere browser over te stappen.
    </p>
    <textarea id="export-json" ref="exportBox" class="code" readonly rows="8" :value="exportJson" @focus="exportBox?.select()"></textarea>
    <div class="form-actions">
      <button type="button" class="primary" @click="copy">{{ copied ? 'Gekopieerd' : 'Kopiëren' }}</button>
    </div>
  </section>

  <section class="card">
    <h2>Back-up terugzetten</h2>
    <p class="hint">Plak een eerder gekopieerde back-up of kies een bestand. Dit vervangt al je huidige gegevens.</p>
    <textarea id="import-json" v-model="importText" class="code" rows="6" placeholder='{"version": 1, "accounts": [ … ] }'></textarea>
    <div class="form-actions">
      <label class="file-button">
        Bestand kiezen
        <input id="import-file" type="file" accept="application/json,.json" @change="readFile" />
      </label>
      <ConfirmButton
        v-if="importText.trim()"
        label="Terugzetten"
        question="Huidige gegevens vervangen?"
        @confirm="restore"
      />
    </div>
    <p v-if="message" :class="message.ok ? 'notice' : 'warning'">{{ message.text }}</p>
  </section>

  <section class="card">
    <h2>Alles wissen</h2>
    <p class="hint">Verwijdert alle rekeningen en posten uit deze browser.</p>
    <ConfirmButton label="Alle gegevens wissen" question="Alles wissen?" @confirm="clearData" />
  </section>
</template>
