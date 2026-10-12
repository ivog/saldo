<script setup lang="ts">
import { ref } from 'vue'

// Inline bevestiging in plaats van window.confirm(), dat niet overal werkt (bijv. in een ingesloten frame).
defineProps<{ label?: string; question?: string }>()
const emit = defineEmits<{ confirm: [] }>()
const asking = ref(false)

function yes() {
  asking.value = false
  emit('confirm')
}
</script>

<template>
  <span v-if="asking" class="confirm">
    <span class="confirm-question">{{ question ?? 'Zeker weten?' }}</span>
    <button type="button" class="danger-solid" @click.stop="yes">Ja, verwijderen</button>
    <button type="button" @click.stop="asking = false">Nee</button>
  </span>
  <button v-else type="button" class="danger" @click.stop="asking = true">{{ label ?? 'Verwijderen' }}</button>
</template>
