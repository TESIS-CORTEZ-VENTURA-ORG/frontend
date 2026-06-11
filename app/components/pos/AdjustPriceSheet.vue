<script setup lang="ts">
import type { Order, OrderItem } from '#shared/types/domain'

const props = defineProps<{
  order: Order
}>()

const emit = defineEmits<{
  adjusted: []
}>()

// v-model = item a ajustar (null = cerrado)
const item = defineModel<OrderItem | null>({ required: true })

const toast = useToast()
const patchOrder = usePatchOrder()
const { data: recipes } = useRecipes()

const REASONS = [
  { v: 'costos', label: 'Subió costo de insumos' },
  { v: 'recuperar', label: 'Recuperar margen' },
  { v: 'promo', label: 'Promoción / oferta' },
  { v: 'temporada', label: 'Ajuste estacional' },
  { v: 'otro', label: 'Otro' },
]

const open = computed({
  get: () => item.value !== null,
  set: (v) => {
    if (!v) item.value = null
  },
})

const price = ref(0)
const reason = ref('')
const busy = ref(false)

const recipe = computed(() => (recipes.value ?? []).find(r => r.id === item.value?.recipeId))
const currentPrice = computed(() => item.value?.unitPrice ?? 0)
const cost = computed(() => recipe.value?.cost ?? 0)

const minPrice = computed(() => +(currentPrice.value * 0.5).toFixed(2))
const maxPrice = computed(() => +(currentPrice.value * 1.5).toFixed(2))

watch(item, (it) => {
  if (it) {
    price.value = it.unitPrice
    reason.value = ''
  }
})

const newMargin = computed(() => {
  if (price.value <= 0 || cost.value <= 0) return null
  return Math.round(((price.value - cost.value) / price.value) * 100)
})

const marginStatus = computed(() => {
  if (newMargin.value === null) return 'good'
  if (newMargin.value < 20) return 'crit'
  if (newMargin.value < 30) return 'warn'
  return 'good'
})

function setPrice(n: number): void {
  price.value = Math.max(minPrice.value, Math.min(maxPrice.value, +n.toFixed(2)))
}

const canApply = computed(() => price.value > 0 && price.value !== currentPrice.value && reason.value !== '')

async function apply(close: () => void): Promise<void> {
  if (!canApply.value || !item.value || busy.value) return
  busy.value = true
  try {
    await patchOrder.mutateAsync({
      orderId: props.order.id,
      itemUpdates: [{ id: item.value.id, unitPrice: price.value }],
    })
    toast.add({ title: `Precio de ${item.value.name} ajustado a ${formatPEN(price.value)}`, icon: 'i-lucide-tag' })
    close()
    emit('adjusted')
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <UiBottomSheet v-model="open">
    <template #header>
      <h2 class="sheet-title ap-title-row">
        Ajustar precio
        <span class="ap-owner-pill"><UIcon name="i-lucide-lock" /> Owner</span>
      </h2>
      <div class="sheet-sub">{{ item?.name }}</div>
    </template>

    <template v-if="item">
      <!-- Estado actual -->
      <section class="ap-current" aria-label="Estado actual">
        <div class="ap-emoji" aria-hidden="true">{{ recipe?.emoji ?? '🍽️' }}</div>
        <div class="ap-grid">
          <div class="ap-stat">
            <span class="lbl">Precio actual</span>
            <span class="val">{{ formatPEN(currentPrice) }}</span>
          </div>
          <div class="ap-stat">
            <span class="lbl">Costo</span>
            <span class="val">{{ cost > 0 ? formatPEN(cost) : '—' }}</span>
          </div>
          <div class="ap-stat">
            <span class="lbl">Margen actual</span>
            <span class="val">{{ recipe ? `${recipe.marginPct} %` : '—' }}</span>
          </div>
          <div class="ap-stat">
            <span class="lbl">Vendidos hoy</span>
            <span class="val">{{ recipe?.soldToday ?? '—' }}</span>
          </div>
        </div>
      </section>

      <!-- Nuevo precio -->
      <section class="field-block">
        <div class="field-label">
          <span>Nuevo precio</span>
          <span class="hint">{{ formatPEN(minPrice) }} – {{ formatPEN(maxPrice) }}</span>
        </div>
        <div class="ap-price-row">
          <button class="ap-step" aria-label="Bajar S/ 1" @click="setPrice(price - 1)">
            <UIcon name="i-lucide-minus" />
          </button>
          <div class="ap-price-display" :class="`is-${marginStatus}`">
            <span class="cur">S/</span>
            <input
              v-model.number="price"
              type="number"
              step="0.5"
              :min="minPrice"
              :max="maxPrice"
              aria-label="Nuevo precio en soles"
              @blur="setPrice(price)"
            >
          </div>
          <button class="ap-step plus" aria-label="Subir S/ 1" @click="setPrice(price + 1)">
            <UIcon name="i-lucide-plus" />
          </button>
        </div>
        <div v-if="newMargin !== null" class="ap-margin" :class="`is-${marginStatus}`">
          <UIcon :name="marginStatus === 'good' ? 'i-lucide-trending-up' : 'i-lucide-alert-triangle'" />
          Nuevo margen: <b>{{ newMargin }} %</b>
          <span v-if="recipe" class="delta">({{ newMargin - recipe.marginPct >= 0 ? '+' : '' }}{{ newMargin - recipe.marginPct }} pts)</span>
        </div>
      </section>

      <!-- Motivo -->
      <section class="field-block">
        <div class="field-label">
          <span>Motivo del ajuste</span>
          <span class="hint">Obligatorio</span>
        </div>
        <div class="ap-reasons">
          <button
            v-for="r in REASONS"
            :key="r.v"
            type="button"
            class="ap-reason"
            :class="{ on: reason === r.v }"
            @click="reason = r.v"
          >{{ r.label }}</button>
        </div>
      </section>
    </template>

    <template #cta="{ close }">
      <button class="btn btn-primary btn-lg btn-block" :disabled="!canApply || busy" @click="apply(close)">
        <UIcon name="i-lucide-check" /> Aplicar nuevo precio
      </button>
    </template>
  </UiBottomSheet>
</template>

<style scoped>
.ap-title-row { display: flex; align-items: center; gap: 8px; }
.ap-owner-pill {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  background: var(--mostaza-100); color: var(--mostaza-700);
  padding: 3px 8px; border-radius: 999px;
}
.ap-owner-pill .iconify { width: 11px; height: 11px; }

.ap-current {
  display: flex; gap: 14px; align-items: center;
  background: var(--pure-white);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 18px;
}
.ap-emoji {
  width: 52px; height: 52px; border-radius: 14px;
  background: var(--crema-200);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
}
.ap-grid {
  flex: 1;
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 8px 14px;
}
.ap-stat { display: flex; flex-direction: column; gap: 1px; }
.ap-stat .lbl { font-size: 10.5px; color: var(--fg3); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
.ap-stat .val { font-size: 14px; font-weight: 600; color: var(--fg1); font-variant-numeric: tabular-nums; }

.ap-price-row { display: grid; grid-template-columns: 56px 1fr 56px; gap: 10px; align-items: stretch; }
.ap-step {
  border-radius: 14px;
  background: var(--crema-200); color: var(--fg1);
  border: none; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  transition: transform 80ms;
}
.ap-step:active { transform: scale(0.94); }
.ap-step.plus { background: var(--terracotta); color: var(--crema-100); }
.ap-step .iconify { width: 18px; height: 18px; }
.ap-price-display {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  background: var(--pure-white);
  border: 2px solid var(--border);
  border-radius: 14px;
  padding: 10px;
  transition: border-color var(--dur) var(--ease-standard);
}
.ap-price-display.is-crit { border-color: var(--danger); }
.ap-price-display.is-warn { border-color: var(--mostaza); }
.ap-price-display.is-good { border-color: var(--oliva); }
.ap-price-display .cur { font-size: 15px; font-weight: 600; color: var(--fg3); }
.ap-price-display input {
  width: 90px;
  border: none; outline: none; background: transparent;
  font: inherit; font-size: 30px; font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--fg1);
  font-variant-numeric: tabular-nums;
  text-align: center;
}
.ap-margin {
  display: flex; align-items: center; gap: 6px;
  font-size: 12.5px;
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 10px;
}
.ap-margin.is-crit { background: var(--danger-bg); color: var(--danger); }
.ap-margin.is-warn { background: var(--warning-bg); color: var(--mostaza-700); }
.ap-margin.is-good { background: var(--success-bg); color: var(--oliva-700); }
.ap-margin .iconify { width: 14px; height: 14px; }
.ap-margin .delta { opacity: 0.8; }

.ap-reasons { display: flex; flex-wrap: wrap; gap: 6px; }
.ap-reason {
  font: inherit; font-size: 12.5px; font-weight: 600;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--fg2);
  padding: 8px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition: background var(--dur) var(--ease-standard), color var(--dur) var(--ease-standard), border-color var(--dur) var(--ease-standard);
}
.ap-reason.on { background: var(--espresso); color: var(--crema-100); border-color: var(--espresso); }
</style>
