<script setup lang="ts">
import type { Order } from '#shared/types/domain'

const props = defineProps<{
  order: Order
}>()

const emit = defineEmits<{
  applied: []
}>()

const open = defineModel<boolean>({ required: true })

const toast = useToast()
const patchOrder = usePatchOrder()

const REASONS = [
  { id: 'cortesia', label: 'Cortesía de la casa' },
  { id: 'frecuente', label: 'Cliente frecuente' },
  { id: 'promo', label: 'Promoción del día' },
  { id: 'error', label: 'Error de cocina' },
  { id: 'otro', label: 'Otro…' },
]
const PCT_CHIPS = [5, 10, 15, 20]
const AMT_CHIPS = [10, 20, 50]

const mode = ref<'percent' | 'amount'>('percent')
const pct = ref(10)
const amt = ref('')
const reason = ref('')
const otherText = ref('')
const busy = ref(false)

const total = computed(() => props.order.items.reduce((s, it) => s + it.qty * it.unitPrice, 0))

watch(open, (isOpen) => {
  if (isOpen) {
    mode.value = 'percent'
    pct.value = 10
    amt.value = ''
    reason.value = ''
    otherText.value = ''
  }
})

const pctNum = computed(() => Math.max(0, Math.min(50, pct.value || 0)))
const amtNum = computed(() => Math.max(0, Number(amt.value) || 0))
const amtOver = computed(() => amtNum.value > total.value)

const discount = computed(() =>
  mode.value === 'percent'
    ? (total.value * pctNum.value) / 100
    : Math.min(amtNum.value, total.value),
)
const finalTotal = computed(() => Math.max(0, total.value - discount.value))
const effectivePct = computed(() => (total.value > 0 ? (discount.value / total.value) * 100 : 0))
const hasDiscount = computed(() => discount.value > 0.005)

const reasonOk = computed(() => reason.value !== '' && (reason.value !== 'otro' || otherText.value.trim().length > 0))
const amountOk = computed(() => mode.value === 'percent' ? pctNum.value > 0 : (amtNum.value > 0 && !amtOver.value))
const canApply = computed(() => amountOk.value && reasonOk.value)

const sliderFill = computed(() => `${(pctNum.value / 50) * 100}%`)

const hint = computed(() => {
  if (!amountOk.value) {
    if (mode.value === 'percent') return 'Ingresa un porcentaje mayor a 0.'
    return amtOver.value ? 'Monto excede el total.' : 'Ingresa un monto a descontar.'
  }
  return 'Selecciona un motivo para continuar.'
})

async function apply(close: () => void): Promise<void> {
  if (!canApply.value || busy.value) return
  busy.value = true
  try {
    const reasonLabel = reason.value === 'otro'
      ? otherText.value.trim()
      : REASONS.find(r => r.id === reason.value)?.label
    await patchOrder.mutateAsync({
      orderId: props.order.id,
      discount: mode.value === 'percent'
        ? { type: 'pct', value: pctNum.value, reason: reasonLabel }
        : { type: 'amount', value: +discount.value.toFixed(2), reason: reasonLabel },
    })
    toast.add({
      title: `Descuento de ${mode.value === 'percent' ? `${pctNum.value} %` : formatPEN(discount.value)} aplicado`,
      icon: 'i-lucide-badge-percent',
    })
    close()
    emit('applied')
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <UiBottomSheet v-model="open">
    <template #header>
      <h2 class="sheet-title dsc-title-row">
        Aplicar descuento
        <span class="dsc-owner-pill" title="Solo dueño/admin">
          <UIcon name="i-lucide-shield-check" /> Owner
        </span>
      </h2>
      <div class="sheet-sub">Total actual {{ formatPEN(total) }}</div>
    </template>

    <!-- Tipo -->
    <div class="dsc-toggle" role="tablist" aria-label="Tipo de descuento">
      <button type="button" role="tab" :aria-selected="mode === 'percent'" :class="{ on: mode === 'percent' }" @click="mode = 'percent'">
        <UIcon name="i-lucide-percent" /> Por porcentaje
      </button>
      <button type="button" role="tab" :aria-selected="mode === 'amount'" :class="{ on: mode === 'amount' }" @click="mode = 'amount'">
        <UIcon name="i-lucide-banknote" /> Monto fijo
      </button>
    </div>

    <!-- Porcentaje -->
    <section v-if="mode === 'percent'" class="dsc-block">
      <div class="field-label">
        <span>Porcentaje</span>
        <span class="hint">0–50 %</span>
      </div>
      <div class="dsc-slider-row">
        <div class="dsc-slider-shell" :style="{ '--pct': sliderFill }">
          <input
            v-model.number="pct"
            type="range"
            class="dsc-slider"
            min="0" max="50" step="1"
            aria-label="Porcentaje de descuento"
          >
        </div>
        <div class="dsc-input-wrap dsc-pct-input">
          <input
            v-model.number="pct"
            type="number"
            class="dsc-input"
            inputmode="numeric"
            min="0" max="50" step="1"
            aria-label="Porcentaje exacto"
          >
          <span class="dsc-affix" aria-hidden="true">%</span>
        </div>
      </div>
      <div class="dsc-chips" role="group" aria-label="Porcentajes rápidos">
        <button
          v-for="c in PCT_CHIPS"
          :key="c"
          type="button"
          class="dsc-chip"
          :class="{ on: pctNum === c }"
          @click="pct = c"
        >{{ c }}%</button>
      </div>
    </section>

    <!-- Monto -->
    <section v-else class="dsc-block">
      <div class="field-label">
        <span>Monto a descontar</span>
        <span class="hint">Máx {{ formatPEN(total) }}</span>
      </div>
      <div class="dsc-input-wrap" :class="{ 'is-error': amtOver }">
        <span class="dsc-affix-start" aria-hidden="true">S/</span>
        <input
          v-model="amt"
          type="text"
          class="dsc-input has-affix"
          inputmode="decimal"
          placeholder="0.00"
          aria-label="Monto del descuento en soles"
          :aria-invalid="amtOver"
        >
      </div>
      <div v-if="amtOver" class="dsc-error" role="alert">
        <UIcon name="i-lucide-alert-circle" />
        El descuento no puede exceder {{ formatPEN(total) }}.
      </div>
      <div class="dsc-chips" role="group" aria-label="Montos rápidos">
        <button
          v-for="c in AMT_CHIPS"
          :key="c"
          type="button"
          class="dsc-chip"
          :class="{ on: amtNum === c }"
          @click="amt = String(c)"
        >S/ {{ c }}</button>
      </div>
    </section>

    <!-- Vista previa -->
    <section class="dsc-preview" :class="{ 'is-active': hasDiscount }" aria-live="polite">
      <div class="dsc-pre-row">
        <span class="lab">Total original</span>
        <span class="val" :class="{ 'is-struck': hasDiscount }">{{ formatPEN(total) }}</span>
      </div>
      <div class="dsc-pre-row discount">
        <span class="lab">
          Descuento
          <span v-if="hasDiscount" class="pct">−{{ effectivePct.toFixed(effectivePct >= 10 ? 0 : 1) }}%</span>
        </span>
        <span class="val">{{ hasDiscount ? `− ${formatPEN(discount)}` : 'S/ 0.00' }}</span>
      </div>
      <div class="dsc-pre-divider" aria-hidden="true" />
      <div class="dsc-pre-row final" :class="{ 'is-active': hasDiscount }">
        <span class="lab">Total final</span>
        <span class="val">{{ formatPEN(finalTotal) }}</span>
      </div>
    </section>

    <!-- Motivo -->
    <section class="dsc-block">
      <div class="field-label">
        <span>Motivo del descuento</span>
        <span class="hint">Obligatorio</span>
      </div>
      <div class="dsc-select-wrap">
        <select v-model="reason" class="dsc-select" :class="{ 'is-empty': reason === '' }" aria-label="Motivo del descuento">
          <option value="" disabled>Selecciona un motivo…</option>
          <option v-for="r in REASONS" :key="r.id" :value="r.id">{{ r.label }}</option>
        </select>
        <span class="dsc-select-chev" aria-hidden="true"><UIcon name="i-lucide-chevron-down" /></span>
      </div>
      <input
        v-if="reason === 'otro'"
        v-model="otherText"
        type="text"
        class="field-input dsc-other"
        placeholder="Describe el motivo…"
        maxlength="80"
        aria-label="Motivo personalizado"
      >
    </section>

    <template #cta="{ close }">
      <div v-if="!canApply" class="dsc-cta-hint" role="status">
        <UIcon name="i-lucide-info" /> {{ hint }}
      </div>
      <div class="dsc-cta-row">
        <button type="button" class="btn btn-ghost" @click="close">Cancelar</button>
        <button type="button" class="btn btn-primary" :disabled="!canApply || busy" @click="apply(close)">
          <UIcon name="i-lucide-check" /> Aplicar descuento
        </button>
      </div>
    </template>
  </UiBottomSheet>
</template>

<style scoped>
.dsc-title-row { display: flex; align-items: center; gap: 8px; }
.dsc-owner-pill {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  background: var(--mostaza-100); color: var(--mostaza-700);
  padding: 3px 8px; border-radius: 999px;
}
.dsc-owner-pill .iconify { width: 11px; height: 11px; }

.dsc-toggle {
  display: flex;
  background: var(--crema-200);
  border-radius: 12px;
  padding: 3px;
  gap: 2px;
  margin-bottom: 18px;
}
.dsc-toggle button {
  flex: 1;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  background: transparent; border: none;
  font: inherit; font-size: 13px; font-weight: 600;
  color: var(--fg2);
  padding: 10px;
  border-radius: 9px;
  cursor: pointer;
  transition: background var(--dur) var(--ease-standard), color var(--dur) var(--ease-standard);
}
.dsc-toggle button.on { background: var(--pure-white); color: var(--fg1); box-shadow: var(--shadow-sm); }
.dsc-toggle .iconify { width: 14px; height: 14px; }

.dsc-block { margin-bottom: 18px; }

.dsc-slider-row { display: flex; align-items: center; gap: 12px; }
.dsc-slider-shell { flex: 1; position: relative; height: 32px; display: flex; align-items: center; }
.dsc-slider {
  width: 100%;
  appearance: none;
  -webkit-appearance: none;
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(to right, var(--terracotta) var(--pct), var(--crema-200) var(--pct));
  outline: none;
  cursor: pointer;
}
.dsc-slider::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--pure-white);
  border: 2px solid var(--terracotta);
  box-shadow: var(--shadow-sm);
  cursor: grab;
}
.dsc-slider::-moz-range-thumb {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--pure-white);
  border: 2px solid var(--terracotta);
  box-shadow: var(--shadow-sm);
  cursor: grab;
}
.dsc-pct-input { width: 110px; flex-shrink: 0; }

.dsc-input-wrap { position: relative; }
.dsc-input {
  width: 100%;
  background: var(--pure-white);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 34px 12px 14px;
  font: inherit; font-size: 18px; font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--fg1);
  outline: none;
  text-align: right;
  transition: border-color var(--dur) var(--ease-standard), box-shadow var(--dur) var(--ease-standard);
}
.dsc-input:focus { border-color: var(--terracotta); box-shadow: 0 0 0 3px rgba(201, 106, 67, 0.18); }
.dsc-input.has-affix { padding-left: 40px; text-align: left; }
.dsc-input-wrap.is-error .dsc-input { border-color: var(--danger); }
.dsc-affix {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  font-size: 14px; font-weight: 600; color: var(--fg3);
}
.dsc-affix-start {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  font-size: 14px; font-weight: 600; color: var(--fg3);
}
.dsc-error {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--danger);
  margin-top: 8px;
}
.dsc-error .iconify { width: 13px; height: 13px; }

.dsc-chips { display: flex; gap: 6px; margin-top: 12px; }
.dsc-chip {
  flex: 1;
  font: inherit; font-size: 13px; font-weight: 600;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--fg2);
  padding: 8px 0;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--dur) var(--ease-standard), color var(--dur) var(--ease-standard), border-color var(--dur) var(--ease-standard);
}
.dsc-chip.on { background: var(--espresso); color: var(--crema-100); border-color: var(--espresso); }

.dsc-preview {
  background: var(--pure-white);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 18px;
  transition: border-color var(--dur) var(--ease-standard);
}
.dsc-preview.is-active { border-color: var(--terracotta-300); }
.dsc-pre-row {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 13.5px; color: var(--fg2);
  padding: 4px 0;
}
.dsc-pre-row .val { font-variant-numeric: tabular-nums; font-weight: 600; color: var(--fg1); }
.dsc-pre-row .val.is-struck { text-decoration: line-through; color: var(--fg3); font-weight: 500; }
.dsc-pre-row.discount .val { color: var(--terracotta-700); }
.dsc-pre-row .pct {
  font-size: 11px; font-weight: 700;
  background: var(--terracotta-100); color: var(--terracotta-700);
  padding: 1px 7px; border-radius: 999px;
  margin-left: 6px;
}
.dsc-pre-divider { border-top: 1px dashed var(--border); margin: 6px 0; }
.dsc-pre-row.final { font-size: 15px; }
.dsc-pre-row.final .val { font-size: 20px; letter-spacing: -0.02em; }
.dsc-pre-row.final.is-active .val { color: var(--terracotta-700); }

.dsc-select-wrap { position: relative; }
.dsc-select {
  width: 100%;
  appearance: none;
  background: var(--pure-white);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 38px 12px 14px;
  font: inherit; font-size: 14px;
  color: var(--fg1);
  outline: none;
  cursor: pointer;
}
.dsc-select.is-empty { color: var(--fg3); }
.dsc-select:focus { border-color: var(--terracotta); box-shadow: 0 0 0 3px rgba(201, 106, 67, 0.18); }
.dsc-select-chev {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  color: var(--fg3);
  pointer-events: none;
}
.dsc-select-chev .iconify { width: 16px; height: 16px; }
.dsc-other { margin-top: 10px; }

.dsc-cta-hint {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--fg3);
  margin-bottom: 10px;
}
.dsc-cta-hint .iconify { width: 13px; height: 13px; }
.dsc-cta-row { display: grid; grid-template-columns: auto 1fr; gap: 10px; }
.dsc-cta-row .btn { min-height: 48px; border-radius: 12px; justify-content: center; font-size: 14px; }
</style>
