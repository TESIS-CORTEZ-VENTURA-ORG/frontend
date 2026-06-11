<script setup lang="ts">
import type { DiningTable, Recipe } from '#shared/types/domain'

const props = defineProps<{
  table: DiningTable
}>()

const emit = defineEmits<{
  confirm: [items: Array<{ recipeId: string, qty: number }>, summary: { count: number, total: number }]
}>()

const open = defineModel<boolean>({ required: true })

const { data: recipes } = useRecipes()

const query = ref('')
const activeCat = ref('Todos')
const cart = ref<Record<string, number>>({})

const tableLabel = computed(() => String(props.table.number).padStart(2, '0'))

watch(open, (isOpen) => {
  if (isOpen) {
    query.value = ''
    activeCat.value = 'Todos'
    cart.value = {}
  }
})

/** Solo platos activos se pueden vender desde el POS. */
const sellable = computed<Recipe[]>(() =>
  (recipes.value ?? []).filter(r => r.kind === 'dish' && r.active),
)

const categories = computed<string[]>(() => {
  const seen: string[] = []
  for (const r of sellable.value) {
    if (!seen.includes(r.category)) seen.push(r.category)
  }
  return seen
})

function matchesQuery(r: Recipe, q: string): boolean {
  if (!q) return true
  return r.name.toLowerCase().includes(q)
    || (r.description?.toLowerCase().includes(q) ?? false)
    || r.category.toLowerCase().includes(q)
}

const filtered = computed<Recipe[]>(() => {
  const q = query.value.trim().toLowerCase()
  return sellable.value.filter(r =>
    (activeCat.value === 'Todos' || r.category === activeCat.value) && matchesQuery(r, q),
  )
})

const grouped = computed<Record<string, Recipe[]>>(() => {
  const out: Record<string, Recipe[]> = {}
  for (const r of filtered.value) {
    (out[r.category] ??= []).push(r)
  }
  return out
})

const chipCounts = computed<Record<string, number>>(() => {
  const q = query.value.trim().toLowerCase()
  const visible = sellable.value.filter(r => matchesQuery(r, q))
  const map: Record<string, number> = { Todos: visible.length }
  for (const r of visible) map[r.category] = (map[r.category] ?? 0) + 1
  return map
})

const itemCount = computed(() => Object.values(cart.value).reduce((s, q) => s + q, 0))
const totalSoles = computed(() => Object.entries(cart.value).reduce((s, [id, q]) => {
  const r = sellable.value.find(x => x.id === id)
  return r ? s + r.sellPrice * q : s
}, 0))

function add(id: string): void {
  cart.value = { ...cart.value, [id]: (cart.value[id] ?? 0) + 1 }
}

function dec(id: string): void {
  const cur = cart.value[id] ?? 0
  if (cur <= 1) {
    const { [id]: _removed, ...rest } = cart.value
    cart.value = rest
  }
  else {
    cart.value = { ...cart.value, [id]: cur - 1 }
  }
}

function confirmSelection(close: () => void): void {
  const items = Object.entries(cart.value).map(([recipeId, qty]) => ({ recipeId, qty }))
  if (!items.length) return
  emit('confirm', items, { count: itemCount.value, total: totalSoles.value })
  close()
}
</script>

<template>
  <UiBottomSheet v-model="open">
    <template #header>
      <div class="cat-hdr-row">
        <div class="cat-title-wrap">
          <h2 class="cat-title">Agregar a <em>Mesa {{ tableLabel }}</em></h2>
          <div class="cat-sub">
            <UIcon name="i-lucide-circle-dashed" />
            Aún no se envía a cocina
          </div>
        </div>
        <div class="cat-counter" :class="{ has: itemCount > 0 }" aria-live="polite">
          <span class="num">{{ itemCount }}</span>
          <span>{{ itemCount === 1 ? 'item' : 'items' }}</span>
        </div>
      </div>
    </template>

    <div class="cat-sticky">
      <label class="cat-search">
        <UIcon name="i-lucide-search" />
        <input
          v-model="query"
          type="search"
          placeholder="Buscar plato, bebida, postre…"
          aria-label="Buscar productos"
        >
        <button v-if="query" class="cat-search-clear" aria-label="Limpiar búsqueda" @click="query = ''">
          <UIcon name="i-lucide-x" />
        </button>
      </label>

      <nav class="cat-chips" aria-label="Filtrar por categoría">
        <button
          v-for="cat in ['Todos', ...categories]"
          :key="cat"
          class="cat-chip"
          :class="{ active: activeCat === cat }"
          :aria-pressed="activeCat === cat"
          :disabled="cat !== 'Todos' && !(chipCounts[cat] ?? 0)"
          @click="activeCat = cat"
        >
          {{ cat }}
          <span v-if="cat === 'Todos' || (chipCounts[cat] ?? 0) > 0" class="count">{{ chipCounts[cat] ?? 0 }}</span>
        </button>
      </nav>
    </div>

    <UiEmptyState
      v-if="!filtered.length"
      icon="i-lucide-search-x"
      title="Sin resultados"
      subtitle="Prueba con otra palabra o cambia la categoría."
    />

    <section v-for="cat in categories" v-else :key="cat" class="cat-group">
      <template v-if="grouped[cat]?.length">
        <header class="cat-group-head">
          <span class="lab">{{ cat }}</span>
          <span class="ln" aria-hidden="true" />
          <span class="num">{{ grouped[cat]?.length }}</span>
        </header>
        <div class="cat-cards">
          <article
            v-for="r in grouped[cat]"
            :key="r.id"
            class="cat-card"
            :class="{ added: (cart[r.id] ?? 0) > 0 }"
          >
            <div class="cat-thumb" aria-hidden="true">
              <span v-if="r.emoji" class="emoji">{{ r.emoji }}</span>
              <UIcon v-else name="i-lucide-utensils" />
            </div>
            <div class="cat-body">
              <div class="cat-name">{{ r.name }}</div>
              <div v-if="r.description" class="cat-desc">{{ r.description }}</div>
              <div class="cat-pricerow">
                <span class="cat-price">{{ formatPEN(r.sellPrice) }}</span>
              </div>
            </div>

            <button
              v-if="!(cart[r.id] ?? 0)"
              class="cat-add"
              :aria-label="`Agregar ${r.name}`"
              @click="add(r.id)"
            >
              <UIcon name="i-lucide-plus" />
            </button>
            <div v-else class="cat-step" role="group" :aria-label="`Cantidad de ${r.name}`">
              <button :aria-label="`Disminuir ${r.name}`" @click="dec(r.id)">
                <UIcon name="i-lucide-minus" />
              </button>
              <span class="val" aria-live="polite">{{ cart[r.id] }}</span>
              <button :aria-label="`Aumentar ${r.name}`" @click="add(r.id)">
                <UIcon name="i-lucide-plus" />
              </button>
            </div>
          </article>
        </div>
      </template>
    </section>

    <template #cta="{ close }">
      <div v-if="itemCount === 0" class="cat-cta-empty" role="status">
        <UIcon name="i-lucide-hand" />
        Selecciona al menos 1 producto
      </div>
      <template v-else>
        <div class="cat-hint">
          <UIcon name="i-lucide-info" />
          Se agregan a <b>&nbsp;Por enviar</b>&nbsp;— aún no van a cocina
        </div>
        <button class="cat-cta-go" @click="confirmSelection(close)">
          <span class="cat-cta-badge">{{ itemCount }}</span>
          <span class="cat-cta-summary">
            <span class="cat-cta-line1">Agregar al pedido</span>
            <span class="cat-cta-line2">{{ formatPEN(totalSoles) }}</span>
          </span>
          <span class="cat-cta-arrow"><UIcon name="i-lucide-arrow-right" /></span>
        </button>
      </template>
    </template>
  </UiBottomSheet>
</template>

<style scoped>
/* ---- Header ---- */
.cat-hdr-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px;
}
.cat-title-wrap { min-width: 0; }
.cat-title {
  margin: 0;
  font-size: 17px; font-weight: 600;
  letter-spacing: -0.01em; line-height: 1.15;
  color: var(--fg1);
}
.cat-title em {
  font-family: var(--font-serif);
  font-style: italic; font-weight: 500;
  color: var(--terracotta-700);
}
.cat-sub {
  font-size: 11.5px; color: var(--fg3);
  margin-top: 2px;
  display: inline-flex; align-items: center; gap: 5px;
}
.cat-sub .iconify { width: 11px; height: 11px; }

.cat-counter {
  display: inline-flex; align-items: baseline; gap: 4px;
  font-family: var(--font-mono);
  font-size: 12px; font-weight: 600;
  background: var(--crema-200);
  color: var(--fg2);
  padding: 6px 10px;
  border-radius: 999px;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  transition: background var(--dur), color var(--dur);
}
.cat-counter.has {
  background: var(--terracotta-100);
  color: var(--terracotta-700);
}
.cat-counter .num { font-weight: 700; }

/* ---- Sticky search + chips (dentro del scroll del sheet) ---- */
.cat-sticky {
  position: sticky; top: 0;
  z-index: 3;
  background: var(--crema-100);
  margin: -4px 0 4px;
  padding: 4px 0 0;
  border-bottom: 1px solid var(--border-subtle);
}
.cat-search {
  position: relative;
  display: flex; align-items: center;
  background: var(--pure-white);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0 14px;
  transition: border-color var(--dur), box-shadow var(--dur);
}
.cat-search:focus-within {
  border-color: var(--terracotta);
  box-shadow: 0 0 0 3px rgba(201, 106, 67, 0.18);
}
.cat-search > .iconify {
  width: 16px; height: 16px; color: var(--fg3);
  flex-shrink: 0;
}
.cat-search input {
  flex: 1;
  border: none; outline: none; background: transparent;
  font: inherit;
  font-size: 15px;
  color: var(--fg1);
  padding: 13px 10px;
  min-width: 0;
}
.cat-search input::placeholder { color: var(--fg3); }
.cat-search-clear {
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--crema-200);
  border: none;
  color: var(--fg2);
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}
.cat-search-clear:hover { background: var(--border); color: var(--fg1); }
.cat-search-clear .iconify { width: 12px; height: 12px; }

.cat-chips {
  display: flex; gap: 6px;
  padding: 10px 0 12px;
  overflow-x: auto;
  scrollbar-width: none;
  scroll-snap-type: x proximity;
}
.cat-chips::-webkit-scrollbar { display: none; }
.cat-chip {
  flex: 0 0 auto;
  scroll-snap-align: start;
  font: inherit;
  font-size: 13px; font-weight: 600;
  background: var(--pure-white);
  color: var(--fg2);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  padding: 8px 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--dur) var(--ease-standard);
}
.cat-chip:hover { background: var(--crema-200); color: var(--fg1); }
.cat-chip:disabled { opacity: 0.4; cursor: not-allowed; }
.cat-chip.active {
  background: var(--espresso);
  color: var(--crema-100);
  border-color: var(--espresso);
}
.cat-chip .count {
  font-family: var(--font-mono);
  font-size: 11px; font-weight: 500;
  margin-left: 6px;
  opacity: 0.7;
}

/* ---- Grupos ---- */
.cat-group { padding: 4px 0 8px; }
.cat-group-head {
  padding: 14px 0 8px;
  display: flex; align-items: center; gap: 8px;
}
.cat-group-head .lab {
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--terracotta-700);
}
.cat-group-head .ln {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--terracotta-100), transparent);
}
.cat-group-head .num {
  font-family: var(--font-mono);
  font-size: 10.5px; font-weight: 600;
  color: var(--fg3);
}

/* ---- Cards ---- */
.cat-cards {
  display: flex; flex-direction: column;
  background: var(--pure-white);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  overflow: hidden;
}
.cat-card {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 12px;
  padding: 12px;
  align-items: center;
  border-bottom: 1px solid var(--border-subtle);
  position: relative;
  transition: background var(--dur);
}
.cat-card:last-child { border-bottom: none; }
.cat-card.added { background: rgba(201, 106, 67, 0.04); }

.cat-thumb {
  width: 64px; height: 64px;
  border-radius: 10px;
  background: repeating-linear-gradient(135deg, var(--crema-200) 0 6px, var(--crema-100) 6px 12px);
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--terracotta-700);
  flex-shrink: 0;
  overflow: hidden;
}
.cat-thumb .iconify { width: 22px; height: 22px; opacity: 0.85; }
.cat-thumb .emoji { font-size: 26px; line-height: 1; }

.cat-body { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.cat-name {
  font-size: 14px; font-weight: 600;
  color: var(--fg1);
  line-height: 1.25;
  letter-spacing: -0.005em;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cat-desc {
  font-size: 12px;
  color: var(--fg3);
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cat-pricerow {
  display: inline-flex; align-items: center; gap: 6px;
  margin-top: 3px;
}
.cat-price {
  font-family: var(--font-mono);
  font-size: 13px; font-weight: 600;
  color: var(--fg1);
  font-variant-numeric: tabular-nums;
}

.cat-add {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: var(--terracotta);
  border: none;
  color: var(--crema-100);
  cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background var(--dur), transform 80ms;
  box-shadow: 0 2px 0 rgba(168, 84, 47, 0.4);
}
.cat-add:hover { background: var(--terracotta-700); }
.cat-add:active { transform: scale(0.94); }
.cat-add .iconify { width: 20px; height: 20px; }

.cat-step {
  display: inline-flex; align-items: center;
  background: var(--pure-white);
  border: 1.5px solid var(--terracotta);
  border-radius: 999px;
  height: 44px;
  flex-shrink: 0;
  overflow: hidden;
}
.cat-step button {
  width: 38px; height: 100%;
  border: none; background: transparent;
  color: var(--terracotta-700);
  cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  transition: background var(--dur);
}
.cat-step button:hover { background: var(--terracotta-100); }
.cat-step button:active { transform: scale(0.92); }
.cat-step button .iconify { width: 16px; height: 16px; }
.cat-step .val {
  font-family: var(--font-mono);
  font-size: 14px; font-weight: 700;
  color: var(--terracotta-700);
  min-width: 22px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

/* ---- CTA ---- */
.cat-cta-empty {
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: var(--crema-200);
  color: var(--fg3);
  border: 1px dashed var(--border);
  border-radius: 14px;
  padding: 16px;
  font-size: 13.5px; font-weight: 500;
  cursor: not-allowed;
}
.cat-cta-empty .iconify { width: 14px; height: 14px; }

.cat-hint {
  font-size: 11px; color: var(--fg3);
  text-align: center;
  margin: 0 0 8px;
  display: inline-flex; align-items: center; gap: 5px;
  justify-content: center;
  width: 100%;
}
.cat-hint .iconify { width: 11px; height: 11px; }
.cat-hint b { color: var(--fg2); font-weight: 600; }

.cat-cta-go {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  background: var(--terracotta);
  color: var(--crema-100);
  border: none;
  border-radius: 14px;
  padding: 14px 18px;
  font: inherit;
  cursor: pointer;
  text-align: left;
  transition: background var(--dur), transform 80ms;
  box-shadow: 0 6px 16px rgba(201, 106, 67, 0.30);
}
.cat-cta-go:hover { background: var(--terracotta-700); }
.cat-cta-go:active { transform: scale(0.99); }
.cat-cta-summary {
  display: flex; flex-direction: column; gap: 1px;
  min-width: 0;
}
.cat-cta-line1 {
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase;
  opacity: 0.78;
}
.cat-cta-line2 {
  font-size: 16px; font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
.cat-cta-badge {
  font-family: var(--font-mono);
  font-size: 11px; font-weight: 700;
  background: rgba(255, 255, 255, 0.18);
  padding: 4px 10px;
  border-radius: 999px;
  font-variant-numeric: tabular-nums;
}
.cat-cta-arrow {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  display: inline-flex; align-items: center; justify-content: center;
}
.cat-cta-arrow .iconify { width: 16px; height: 16px; }
</style>
