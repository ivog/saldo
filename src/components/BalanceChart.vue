<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatEuro } from '../lib/format'

const props = defineProps<{ points: { label: string; value: number }[] }>()

const W = 720
const H = 260
const pad = { top: 16, right: 16, bottom: 28, left: 72 }
const hover = ref<number | null>(null)

function niceStep(range: number, ticks: number) {
  const raw = range / ticks
  const mag = 10 ** Math.floor(Math.log10(raw))
  const n = raw / mag
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag
}

const scale = computed(() => {
  const values = props.points.map((p) => p.value)
  let min = Math.min(0, ...values)
  let max = Math.max(0, ...values)
  if (max === min) max = min + 100
  const step = niceStep(max - min, 4)
  min = Math.floor(min / step) * step
  max = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = min; v <= max + step / 2; v += step) ticks.push(v)
  const n = Math.max(1, props.points.length - 1)
  const x = (i: number) => pad.left + (i / n) * (W - pad.left - pad.right)
  const y = (v: number) => pad.top + ((max - v) / (max - min)) * (H - pad.top - pad.bottom)
  return { ticks, x, y }
})

const line = computed(() =>
  props.points.map((p, i) => `${i ? 'L' : 'M'}${scale.value.x(i)},${scale.value.y(p.value)}`).join(' '),
)
const area = computed(() => {
  const { x, y } = scale.value
  const last = props.points.length - 1
  return `${line.value} L${x(last)},${y(0)} L${x(0)},${y(0)} Z`
})

// Toon niet elk maandlabel als er veel punten zijn.
const labelEvery = computed(() => Math.ceil(props.points.length / 12))

function onMove(e: PointerEvent) {
  const svg = e.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  const px = ((e.clientX - rect.left) / rect.width) * W
  const n = Math.max(1, props.points.length - 1)
  const i = Math.round(((px - pad.left) / (W - pad.left - pad.right)) * n)
  hover.value = Math.min(props.points.length - 1, Math.max(0, i))
}
</script>

<template>
  <div class="chart">
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      role="img"
      aria-label="Verwacht saldo per maand"
      @pointermove="onMove"
      @pointerleave="hover = null"
    >
      <g class="grid">
        <g v-for="t in scale.ticks" :key="t">
          <line :x1="pad.left" :x2="W - pad.right" :y1="scale.y(t)" :y2="scale.y(t)" :class="{ zero: t === 0 }" />
          <text :x="pad.left - 8" :y="scale.y(t)" text-anchor="end" dominant-baseline="middle">
            {{ formatEuro(t, true) }}
          </text>
        </g>
        <template v-for="(p, i) in points" :key="p.label">
          <text v-if="i % labelEvery === 0" :x="scale.x(i)" :y="H - 8" text-anchor="middle">{{ p.label }}</text>
        </template>
      </g>
      <path :d="area" class="area" />
      <path :d="line" class="line" />
      <circle
        v-for="(p, i) in points"
        :key="i"
        :cx="scale.x(i)"
        :cy="scale.y(p.value)"
        :r="hover === i ? 5 : 3"
        :class="['dot', { negative: p.value < 0 }]"
      />
      <g v-if="hover !== null" class="tooltip">
        <line :x1="scale.x(hover)" :x2="scale.x(hover)" :y1="pad.top" :y2="H - pad.bottom" />
      </g>
    </svg>
    <div v-if="hover !== null" class="chart-tooltip">
      <span>{{ points[hover].label }}</span>
      <strong :class="{ negative: points[hover].value < 0 }">{{ formatEuro(points[hover].value) }}</strong>
    </div>
  </div>
</template>
