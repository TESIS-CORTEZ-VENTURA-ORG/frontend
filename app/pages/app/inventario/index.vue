<script setup lang="ts">
import type { Ingredient } from '#shared/types/domain'

definePageMeta({ layout: 'app' })
useSeoMeta({ title: 'Stock — GastronomIA' })

definePageHeader(() => ({
  title: 'Stock',
  subtitle: 'Controlá qué tenés, registrá movimientos y reponé lo que falta',
}))

const { data: ingredients } = useIngredients()
const { data: shopping } = useShoppingList()
const toast = useToast()

const query = ref('')
const cat = ref('Todos')

const { mutateAsync: addShopping } = useAddShoppingItem()
// Estado real: qué insumos ya están en la Lista de Compras (no un toggle local).
const inShopping = computed(() => new Set((shopping.value ?? []).map(s => s.ingredientId)))

type StockStatus = 'ok' | 'low' | 'crit'

function statusOf(i: Ingredient): StockStatus {
  // El backend (E05) ya calcula el estado; lo usamos si vino, con fallback local.
  if (i.status) return i.status === 'critical' ? 'crit' : i.status
  if (i.minStock <= 0) return 'ok'
  const ratio = i.stock / i.minStock
  if (ratio < 1) return 'crit'
  if (ratio < 1.5) return 'low'
  return 'ok'
}

const STATUS_LABEL: Record<StockStatus, string> = { ok: 'OK', low: 'Bajo', crit: 'Crítico' }

// Emoji por insumo — iconografía de CONTENIDO (comida), reconocible y cálida.
const EMOJI_BY_NAME: Record<string, string> = {
  'Limón Sutil': '🍋',
  'Aceite de Oliva': '🫒',
  'Aceite vegetal': '🫗',
  'Cilantro': '🌿',
  'Pescado Lenguado': '🐟',
  'Mariscos Mixtos': '🦐',
  'Camarones': '🦐',
  'Lomo de Res': '🥩',
  'Pollo Entero': '🍗',
  'Cebolla Roja': '🧅',
  'Tomate': '🍅',
  'Papa Amarilla': '🥔',
  'Camote': '🍠',
  'Choclo Desgranado': '🌽',
  'Ají Limo': '🌶️',
  'Ají Amarillo': '🌶️',
  'Ají amarillo': '🌶️',
  'Ají limo': '🌶️',
  'Arroz': '🍚',
  'Arroz Extra': '🌾',
  'Pisco Quebranta': '🍾',
  'Ron Blanco': '🥃',
  'Maracuyá': '🥭',
  'Leche Evaporada': '🥛',
  'Queso Fresco': '🧀',
}
const EMOJI_BY_CAT: Record<string, string> = {
  'Pescados y mariscos': '🐟',
  'Pescados y Mariscos': '🐟',
  'Verduras y frutas': '🥬',
  'Verduras': '🥬',
  'Carnes': '🥩',
  'Abarrotes': '🌾',
  'Bebidas': '🥤',
  'Licores': '🍾',
  'Lácteos': '🥛',
  'Hierbas': '🌿',
}
const emojiOf = (i: Ingredient): string => EMOJI_BY_NAME[i.name] ?? EMOJI_BY_CAT[i.category] ?? '🧺'

const all = computed(() => ingredients.value ?? [])

const critical = computed(() => all.value.filter(i => statusOf(i) === 'crit'))

const categories = computed(() => {
  const cats: string[] = ['Todos']
  for (const i of all.value) {
    if (!cats.includes(i.category)) cats.push(i.category)
  }
  return cats
})

const filtered = computed(() =>
  all.value.filter((i) => {
    if (cat.value !== 'Todos' && cat.value !== 'sin-costo' && i.category !== cat.value) return false
    if (cat.value === 'sin-costo' && i.unitCost > 0) return false
    const q = query.value.trim().toLowerCase()
    return !q || i.name.toLowerCase().includes(q)
  }),
)

const noCostCount = computed(() => all.value.filter(i => i.unitCost <= 0).length)
const shoppingTotal = computed(() =>
  (shopping.value ?? []).filter(s => !s.checked).reduce((sum, s) => sum + s.estimatedCost, 0),
)

function fmtStock(i: Ingredient): string {
  if (i.unit === 'kg' && i.stock < 1) return `${Math.round(i.stock * 1000)} g`
  return `${i.stock} ${i.unit}`
}

function fmtMin(i: Ingredient): string {
  if (i.unit === 'kg' && i.minStock < 1) return `${Math.round(i.minStock * 1000)} g`
  return `${i.minStock} ${i.unit}`
}

async function orderItem(i: Ingredient): Promise<void> {
  if (inShopping.value.has(i.id)) {
    toast.add({ title: `${i.name} ya está en la Lista de Compras`, icon: 'i-lucide-info' })
    return
  }
  await addShopping({ ingredientId: i.id })
  toast.add({ title: `${i.name} agregado a Lista de Compras`, icon: 'i-lucide-check-circle-2' })
}

/* ===== Carga masiva CSV (HU-02-02) ===== */
type StockImportReport = {
  total: number
  created: number
  updated: number
  failed: number
  errors: { line: number, message: string }[]
}
const { mutateAsync: importIngredients, isLoading: importing } = useImportIngredients()
const showImport = ref(false)
const importReport = ref<StockImportReport | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

async function onImportFile(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const content = await file.text()
    importReport.value = await importIngredients(content)
    const r = importReport.value
    toast.add({
      title: `Importados: ${r.created} nuevos · ${r.updated} actualizados`,
      icon: 'i-lucide-check-circle-2',
    })
  }
  catch {
    toast.add({ title: 'No se pudo importar el archivo', icon: 'i-lucide-alert-triangle', color: 'error' })
  }
  finally {
    input.value = '' // permite re-subir el mismo archivo
  }
}
</script>

<template>
  <div class="stk-screen">
    <!-- Toolbar full-bleed: búsqueda + scan + acciones (estructura POS) -->
    <div class="scr-toolbar">
      <label class="stk-search scr-toolbar-search">
        <UIcon name="i-lucide-search" />
        <input v-model="query" type="search" placeholder="Buscar insumo…" aria-label="Buscar insumo">
      </label>
      <div class="scr-toolbar-right">
        <button class="stk-scan-btn" aria-label="Escanear código de barras — próximamente" @click="toast.add({ title: 'Scanner próximamente disponible', icon: 'i-lucide-scan-line' })">
          <UIcon name="i-lucide-scan-line" />
          <span class="soon" aria-hidden="true">PRONTO</span>
        </button>
        <button type="button" class="stk-icon-btn" aria-label="Importar insumos (CSV)" @click="showImport = true">
          <UIcon name="i-lucide-upload" />
        </button>
        <NuxtLink to="/app/inventario/movimientos" class="stk-icon-btn" aria-label="Historial de movimientos">
          <UIcon name="i-lucide-history" />
        </NuxtLink>
      </div>
    </div>

    <div class="scr-body">
      <div class="scr-main">

    <!-- Estado del inventario: callout editorial accionable (sin bot/sparkles/EN VIVO) -->
    <component
      :is="critical.length > 0 ? 'NuxtLink' : 'div'"
      :to="critical.length > 0 ? '/app/inventario/lista-compras' : undefined"
      class="stk-status"
      :class="critical.length > 0 ? 'alert' : 'calm'"
      role="status"
      aria-label="Estado del inventario"
    >
      <span class="stk-status-mark" aria-hidden="true">
        <UIcon :name="critical.length > 0 ? 'i-lucide-triangle-alert' : 'i-lucide-check'" />
      </span>
      <span v-if="critical.length > 0" class="stk-status-num">{{ critical.length }}</span>
      <span class="stk-status-body">
        <span class="stk-status-title">
          {{ critical.length > 0 ? 'Insumos que necesitan atención' : 'Inventario al día' }}
        </span>
        <span class="stk-status-text">
          {{ critical.length > 0
            ? `Tenés ${critical.length} insumo${critical.length === 1 ? '' : 's'} bajo el mínimo para el servicio de hoy.`
            : 'Todos tus insumos están por encima del stock mínimo.' }}
        </span>
      </span>
      <span v-if="critical.length > 0" class="stk-status-go" aria-hidden="true">
        Resolver <UIcon name="i-lucide-arrow-right" />
      </span>
    </component>

    <!-- ZONA 1 — Registrar movimientos de stock -->
    <section class="stk-zone" aria-labelledby="zone-mov">
      <h2 id="zone-mov" class="stk-zone-label">Registrar movimientos</h2>
      <div class="stk-zone-grid">
        <NuxtLink to="/app/datos/factura-ia" class="stk-action stk-action--primary">
          <span class="stk-action-ico" aria-hidden="true"><UIcon name="i-lucide-scan-line" /></span>
          <span class="stk-action-body">
            <span class="stk-action-label">Escanear Factura</span>
            <span class="stk-action-sub">Cargá entradas desde una foto, sin tipear</span>
          </span>
          <span class="stk-action-badge">Lo más rápido</span>
        </NuxtLink>

        <NuxtLink to="/app/inventario/movimiento" class="stk-action">
          <span class="stk-action-ico" aria-hidden="true"><UIcon name="i-lucide-plus-circle" /></span>
          <span class="stk-action-label">Ingreso Manual</span>
          <span class="stk-action-sub">Sumá o descontá stock a mano</span>
        </NuxtLink>

        <NuxtLink to="/app/inventario/movimientos" class="stk-action">
          <span class="stk-action-ico" aria-hidden="true"><UIcon name="i-lucide-history" /></span>
          <span class="stk-action-label">Ver Movimientos</span>
          <span class="stk-action-sub">Historial de entradas y salidas</span>
        </NuxtLink>
      </div>
    </section>

    <!-- ZONA 2 — Reponer y controlar -->
    <section class="stk-zone" aria-labelledby="zone-rep">
      <h2 id="zone-rep" class="stk-zone-label">Reponer y controlar</h2>
      <div class="stk-zone-grid stk-zone-grid--3">
        <NuxtLink to="/app/inventario/lista-compras" class="stk-action">
          <span class="stk-action-ico" aria-hidden="true"><UIcon name="i-lucide-shopping-cart" /></span>
          <span class="stk-action-label">Planificar Compra</span>
          <span class="stk-action-sub strong">{{ formatPEN(shoppingTotal) }} sugerido</span>
        </NuxtLink>

        <NuxtLink to="/app/inventario/ordenes-compra" class="stk-action">
          <span class="stk-action-ico" aria-hidden="true"><UIcon name="i-lucide-clipboard-list" /></span>
          <span class="stk-action-label">Órdenes de Compra</span>
          <span class="stk-action-sub">Pedidos enviados a proveedores</span>
        </NuxtLink>

        <NuxtLink to="/app/inventario/mermas" class="stk-action danger">
          <span class="stk-action-ico" aria-hidden="true"><UIcon name="i-lucide-trash-2" /></span>
          <span class="stk-action-label">Registrar Merma</span>
          <span class="stk-action-sub">Descontá lo que se perdió o venció</span>
        </NuxtLink>
      </div>
    </section>

    <!-- Críticos -->
    <section v-if="critical.length" class="stk-section" aria-label="Insumos críticos">
      <div class="stk-section-head">
        <div class="stk-section-title danger">
          <UIcon name="i-lucide-flame" aria-hidden="true" />
          Insumos Críticos
          <span class="count">{{ critical.length }}</span>
        </div>
        <NuxtLink to="/app/inventario/lista-compras" class="stk-section-link">
          Ver lista <UIcon name="i-lucide-chevron-right" />
        </NuxtLink>
      </div>

      <div class="stk-critical-list">
        <div
          v-for="c in critical"
          :key="c.id"
          class="stk-crit"
          role="button"
          tabindex="0"
          :aria-label="`${c.name}, stock ${fmtStock(c)}, mínimo ${fmtMin(c)}`"
          @click="navigateTo(`/app/inventario/producto/${c.id}`)"
        >
          <div class="stk-crit-ico" aria-hidden="true">{{ emojiOf(c) }}</div>
          <div class="stk-crit-body">
            <div class="stk-crit-name">
              {{ c.name }}
              <span class="stk-crit-stock">· {{ fmtStock(c) }}</span>
            </div>
            <div class="stk-crit-meta">
              Mínimo: {{ fmtMin(c) }}
              <span v-if="c.name === 'Limón Sutil'" class="up"> · ↑ Subió 30 % esta semana</span>
            </div>
          </div>
          <button
            class="stk-crit-cta"
            :class="{ done: inShopping.has(c.id) }"
            :aria-label="inShopping.has(c.id) ? `${c.name} agregado a lista` : `Pedir ${c.name}`"
            @click.stop="orderItem(c)"
          >
            <template v-if="inShopping.has(c.id)"><UIcon name="i-lucide-check" /> Agregado</template>
            <template v-else><UIcon name="i-lucide-plus" /> Pedir</template>
          </button>
        </div>
      </div>
    </section>

    <!-- Mi inventario -->
    <section class="stk-section" aria-label="Mi inventario por categoría">
      <h2 class="stk-inv-title">Mi inventario</h2>
      <p class="stk-inv-hint">Tocá un insumo para ver su detalle, costo y consumo.</p>
      <div class="stk-chip-rail" role="tablist" aria-label="Filtros por categoría">
        <button
          v-for="c in categories"
          :key="c"
          role="tab"
          :aria-selected="cat === c"
          class="stk-chip"
          :class="{ active: cat === c }"
          @click="cat = c"
        >{{ c }}</button>
        <button
          v-if="noCostCount > 0"
          role="tab"
          :aria-selected="cat === 'sin-costo'"
          class="stk-chip warn"
          :class="{ active: cat === 'sin-costo' }"
          @click="cat = cat === 'sin-costo' ? 'Todos' : 'sin-costo'"
        >
          <UIcon name="i-lucide-alert-triangle" /> Sin costo ({{ noCostCount }})
        </button>
      </div>

      <div class="stk-inv-list">
        <NuxtLink
          v-for="it in filtered"
          :key="it.id"
          :to="`/app/inventario/producto/${it.id}`"
          class="stk-row"
          :aria-label="`${it.name}, ${it.category}, ${fmtStock(it)}`"
        >
          <div class="stk-row-ico" aria-hidden="true">{{ emojiOf(it) }}</div>
          <div class="stk-row-body">
            <div class="stk-row-name">{{ it.name }}</div>
            <div class="stk-row-cat">{{ it.category }}</div>
            <div class="stk-row-stock">{{ fmtStock(it) }}</div>
          </div>
          <div class="stk-row-right">
            <span class="stk-status-dot" :class="statusOf(it)">
              <span class="d" aria-hidden="true" />
              {{ STATUS_LABEL[statusOf(it)] }}
            </span>
            <span v-if="it.unitCost > 0" class="stk-row-cost">S/ {{ it.unitCost.toFixed(2) }}/{{ it.unit }}</span>
            <span v-else class="stk-row-cost missing">
              <UIcon name="i-lucide-alert-triangle" /> Sin costo
            </span>
          </div>
        </NuxtLink>
        <UiEmptyState
          v-if="filtered.length === 0"
          icon="i-lucide-package-search"
          title="No hay insumos en esta categoría"
          subtitle="Prueba con otro filtro o búsqueda."
        />
      </div>
    </section>
      </div>

      <aside class="scr-aside">
        <section class="scr-panel">
          <header class="scr-panel-head">
            <span class="scr-eyebrow">Inventario</span>
            <h3 class="scr-panel-title">{{ all.length }}<span class="scr-of"> insumos activos</span></h3>
          </header>
          <ul class="stk-todo">
            <li v-if="critical.length" class="stk-todo-item danger">
              <UIcon name="i-lucide-triangle-alert" aria-hidden="true" />
              <NuxtLink to="/app/inventario/lista-compras">
                Reponé {{ critical.length }} insumo{{ critical.length === 1 ? '' : 's' }} crítico{{ critical.length === 1 ? '' : 's' }}
              </NuxtLink>
            </li>
            <li v-if="noCostCount" class="stk-todo-item warn">
              <UIcon name="i-lucide-circle-help" aria-hidden="true" />
              <button type="button" @click="cat = 'sin-costo'">
                Completá el costo de {{ noCostCount }} insumo{{ noCostCount === 1 ? '' : 's' }}
              </button>
            </li>
            <li class="stk-todo-item info">
              <UIcon name="i-lucide-shopping-cart" aria-hidden="true" />
              <NuxtLink to="/app/inventario/lista-compras">
                Compra sugerida: <b>{{ formatPEN(shoppingTotal) }}</b>
              </NuxtLink>
            </li>
            <li v-if="!critical.length && !noCostCount" class="stk-todo-item ok">
              <UIcon name="i-lucide-check" aria-hidden="true" /> Todo al día, sin pendientes.
            </li>
          </ul>
        </section>
      </aside>
    </div>

    <!-- Carga masiva CSV (HU-02-02) -->
    <UiBottomSheet v-model="showImport" title="Importar insumos (CSV)">
      <div class="stk-import">
        <p class="stk-import-hint">
          Sube un archivo <b>CSV</b> con cabecera <code>sku, name, type, unit, unitCost, category</code>.
          La carga es <b>idempotente</b>: re-subir actualiza por SKU, no duplica.
        </p>
        <label class="stk-import-drop" :class="{ busy: importing }">
          <UIcon :name="importing ? 'i-lucide-loader-circle' : 'i-lucide-upload'" :class="{ spin: importing }" />
          <span>{{ importing ? 'Importando…' : 'Elegir archivo CSV' }}</span>
          <input
            ref="fileInput"
            type="file"
            accept=".csv,text/csv"
            :disabled="importing"
            hidden
            @change="onImportFile"
          >
        </label>

        <div v-if="importReport" class="stk-import-report">
          <div class="stk-import-stats">
            <span class="ok">{{ importReport.created }} nuevos</span>
            <span class="upd">{{ importReport.updated }} actualizados</span>
            <span v-if="importReport.failed > 0" class="err">{{ importReport.failed }} con error</span>
          </div>
          <ul v-if="importReport.errors.length" class="stk-import-errors">
            <li v-for="(e, idx) in importReport.errors" :key="idx">
              <b>Línea {{ e.line }}:</b> {{ e.message }}
            </li>
          </ul>
        </div>
      </div>
    </UiBottomSheet>
  </div>
</template>

<style scoped>
.stk-hdr-actions { display: flex; gap: 8px; align-items: center; }
.stk-import { display: flex; flex-direction: column; gap: 14px; padding: 4px 2px; }
.stk-import-hint { font-size: 13px; color: var(--fg2); line-height: 1.5; }
.stk-import-hint code { font-family: var(--font-mono); font-size: 11.5px; background: var(--bg2); padding: 1px 5px; border-radius: 5px; }
.stk-import-drop {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 22px; border: 1.5px dashed var(--border); border-radius: 14px;
  cursor: pointer; font-weight: 600; color: var(--fg1); background: var(--bg2);
}
.stk-import-drop.busy { opacity: 0.7; cursor: default; }
.stk-import-drop .spin { animation: stk-spin 0.9s linear infinite; }
@keyframes stk-spin { to { transform: rotate(360deg); } }
.stk-import-stats { display: flex; flex-wrap: wrap; gap: 8px; }
.stk-import-stats span { font-size: 12.5px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
.stk-import-stats .ok { background: color-mix(in srgb, var(--success) 16%, transparent); color: var(--success); }
.stk-import-stats .upd { background: var(--bg2); color: var(--fg2); }
.stk-import-stats .err { background: color-mix(in srgb, var(--danger) 16%, transparent); color: var(--danger); }
.stk-import-errors { margin-top: 4px; display: flex; flex-direction: column; gap: 4px; max-height: 180px; overflow: auto; }
.stk-import-errors li { font-size: 12px; color: var(--fg2); }
.stk-import-errors b { color: var(--danger); }
.stk-screen { padding: 0; }

.stk-icon-btn {
  width: 40px; height: 40px; border-radius: 12px;
  background: var(--pure-white);
  border: 1px solid var(--border-subtle);
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--fg2);
  transition: background var(--dur) var(--ease-standard);
}
.stk-icon-btn:hover { background: var(--crema-200); color: var(--fg1); }
.stk-icon-btn .iconify { width: 18px; height: 18px; }

.stk-search-wrap { display: flex; gap: 8px; margin-bottom: 14px; }
.stk-search {
  flex: 1;
  display: flex; align-items: center; gap: 8px;
  background: var(--pure-white);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 0 12px;
  height: 42px;
}
.stk-search:focus-within { border-color: var(--terracotta); box-shadow: 0 0 0 3px rgba(201, 106, 67, 0.18); }
.stk-search input {
  flex: 1; border: none; outline: none; background: transparent;
  font: inherit; font-size: 14px; color: var(--fg1);
}
.stk-search input::placeholder { color: var(--fg3); }
.stk-search .iconify { width: 16px; height: 16px; color: var(--fg3); }
.stk-scan-btn {
  position: relative;
  width: 48px; height: 42px; border-radius: 12px;
  background: var(--espresso); color: var(--crema-100);
  border: none; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
}
.stk-scan-btn .iconify { width: 18px; height: 18px; }
.stk-scan-btn .soon {
  position: absolute; top: -6px; right: -6px;
  font-size: 7.5px; font-weight: 700; letter-spacing: 0.04em;
  background: var(--mostaza); color: var(--espresso);
  padding: 2px 5px; border-radius: 999px;
}

/* ── Estado del inventario: callout editorial cálido (reemplaza .stk-ai oscuro) ── */
.stk-status {
  position: relative;
  display: flex; align-items: center; gap: 14px;
  border-radius: 16px;
  padding: 16px 18px;
  margin-bottom: 16px;
  overflow: hidden;
  text-decoration: none;
  transition: transform 80ms var(--ease-standard), box-shadow var(--dur) var(--ease-standard);
}
.stk-status.alert {
  background: linear-gradient(150deg, var(--crema-50) 0%, var(--terracotta-100) 140%);
  border: 1px solid var(--terracotta-100);
  box-shadow: 0 6px 20px -12px rgba(201, 106, 67, 0.5);
}
.stk-status.calm {
  background: linear-gradient(150deg, var(--crema-50) 0%, var(--oliva-100) 160%);
  border: 1px solid var(--oliva-100);
}
/* Técnica uiverse (anillo translúcido en esquina) reskineada a terracota. */
.stk-status::after {
  content: '';
  position: absolute; top: -56px; right: -28px;
  width: 132px; height: 132px; border-radius: 50%;
  border: 22px solid rgba(201, 106, 67, 0.10);
  pointer-events: none;
  transition: transform var(--dur) var(--ease-standard);
}
.stk-status.calm::after { border-color: rgba(110, 123, 97, 0.10); }
.stk-status.alert:hover { transform: translateY(-1px); }
.stk-status.alert:hover::after { transform: scale(1.12); }

.stk-status-mark {
  flex-shrink: 0;
  width: 38px; height: 38px; border-radius: 11px;
  display: inline-flex; align-items: center; justify-content: center;
}
.stk-status.alert .stk-status-mark { background: var(--terracotta-100); color: var(--terracotta-700); }
.stk-status.calm  .stk-status-mark { background: var(--oliva-100); color: var(--oliva-700); }
.stk-status-mark .iconify { width: 19px; height: 19px; }

.stk-status-num {
  flex-shrink: 0;
  font-family: var(--font-serif);
  font-size: 34px; font-weight: 600; line-height: 1;
  color: var(--terracotta-700);
  font-variant-numeric: tabular-nums;
}
.stk-status-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.stk-status-title { font-size: 14px; font-weight: 700; color: var(--fg1); }
.stk-status-text  { font-size: 12.5px; color: var(--fg2); line-height: 1.45; }
.stk-status-go {
  flex-shrink: 0;
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12.5px; font-weight: 700; color: var(--terracotta-700);
}
.stk-status-go .iconify { width: 15px; height: 15px; transition: transform var(--dur) var(--ease-standard); }
.stk-status.alert:hover .stk-status-go .iconify { transform: translateX(3px); }
@media (max-width: 560px) {
  .stk-status-go { display: none; }
  .stk-status-num { font-size: 28px; }
}
@media (prefers-reduced-motion: reduce) {
  .stk-status, .stk-status::after, .stk-status-go .iconify { transition: none; }
}

/* ── Zonas de acción etiquetadas (claridad / agrupación) ── */
.stk-zone { margin-bottom: 22px; }
.stk-zone-label {
  margin: 0 0 10px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--fg3);
}
.stk-zone-grid {
  display: grid; gap: 10px;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}
@media (min-width: 640px) {
  .stk-zone-grid { grid-template-columns: 1.4fr 1fr 1fr; }
  .stk-zone-grid--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

.stk-action {
  position: relative; min-width: 0;
  background: var(--pure-white);
  border: 1px solid var(--border-subtle);
  border-radius: 14px; padding: 14px;
  display: flex; flex-direction: column; min-height: 104px;
  text-decoration: none; overflow: hidden;
  transition: background var(--dur) var(--ease-standard),
              border-color var(--dur) var(--ease-standard), transform 80ms;
}
.stk-action:active { transform: scale(0.98); }
.stk-action:hover { background: var(--crema-50); border-color: var(--border); }
.stk-action:focus-visible { outline: 2px solid var(--terracotta); outline-offset: 2px; }

/* Corner-accent (técnica uiverse reskineada) que crece en hover. */
.stk-action::after {
  content: ''; position: absolute; top: 12px; right: 12px;
  width: 8px; height: 8px;
  border-top: 1.5px solid var(--border-strong);
  border-right: 1.5px solid var(--border-strong);
  opacity: 0.45;
  transition: width var(--dur) var(--ease-standard),
              height var(--dur) var(--ease-standard),
              opacity var(--dur) var(--ease-standard);
}
.stk-action:hover::after { width: 13px; height: 13px; opacity: 1; border-color: var(--terracotta); }

.stk-action-ico {
  width: 32px; height: 32px; display: inline-flex;
  align-items: center; justify-content: center;
  margin-bottom: auto; color: var(--espresso-600);
}
.stk-action-ico .iconify { width: 22px; height: 22px; stroke-width: 1.6; }
.stk-action.danger .stk-action-ico { color: var(--danger); }
.stk-action.danger:hover::after { border-color: var(--danger); }

.stk-action-label { margin-top: 12px; font-size: 13.5px; font-weight: 600; color: var(--fg1); }
.stk-action-sub { font-size: 11.5px; color: var(--fg3); margin-top: 3px; line-height: 1.35; }
.stk-action-sub.strong { color: var(--fg1); font-weight: 600; }

/* ── PRIMARIA (Von Restorff): más grande, glow cálido, badge ── */
.stk-action--primary {
  flex-direction: row; align-items: flex-start; gap: 12px;
  background: linear-gradient(150deg, var(--crema-50) 0%, var(--terracotta-100) 135%);
  border-color: var(--terracotta-100);
  box-shadow: 0 8px 24px -16px rgba(201, 106, 67, 0.55);
}
.stk-action--primary:hover { background: linear-gradient(150deg, var(--crema-100) 0%, var(--terracotta-100) 135%); }
.stk-action--primary .stk-action-ico { color: var(--terracotta-700); margin-bottom: 0; }
.stk-action--primary .stk-action-body { display: flex; flex-direction: column; min-width: 0; }
.stk-action--primary .stk-action-label { margin-top: 0; font-size: 15px; }
.stk-action--primary .stk-action-sub { color: var(--espresso-600); }
.stk-action-badge {
  position: absolute; top: 12px; right: 12px;
  font-size: 9.5px; font-weight: 700; letter-spacing: 0.03em;
  text-transform: uppercase;
  background: var(--terracotta); color: var(--crema-100);
  padding: 3px 7px; border-radius: 999px;
}
.stk-action--primary::after { display: none; }

@media (max-width: 639px) {
  .stk-action--primary { grid-column: 1 / -1; }
}

.stk-section { margin-bottom: 20px; }
.stk-section-head {
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: 10px;
}
.stk-section-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 15px; font-weight: 600; color: var(--fg1);
}
.stk-section-title.danger { color: var(--danger); }
.stk-section-title .count {
  font-family: var(--font-mono);
  font-size: 11px; font-weight: 600;
  background: var(--danger-bg); color: var(--danger);
  padding: 2px 8px; border-radius: 999px;
}
.stk-section-link {
  display: inline-flex; align-items: center; gap: 2px;
  font-size: 12.5px; font-weight: 600;
  color: var(--terracotta-700);
  text-decoration: none;
}
.stk-section-link .iconify { width: 14px; height: 14px; }

.stk-critical-list { display: flex; flex-direction: column; gap: 8px; }
.stk-crit {
  display: flex; align-items: center; gap: 12px;
  background: var(--pure-white);
  border: 1px solid rgba(179, 58, 42, 0.25);
  border-left: 3px solid var(--danger);
  border-radius: 14px;
  padding: 12px 14px;
  cursor: pointer;
  transition: background var(--dur) var(--ease-standard);
}
.stk-crit:hover { background: var(--crema-50); }
.stk-crit-ico {
  width: 40px; height: 40px; border-radius: 12px;
  background: var(--crema-100);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.stk-crit-body { flex: 1; min-width: 0; }
.stk-crit-name {
  font-size: 14px; font-weight: 600; color: var(--fg1);
  display: flex; align-items: center; gap: 4px; flex-wrap: wrap;
}
.stk-crit-stock { color: var(--danger); font-weight: 700; }
.stk-crit-meta { font-size: 12px; color: var(--fg3); margin-top: 2px; }
.stk-crit-meta .up { color: var(--mostaza-700); font-weight: 600; }
.stk-crit-cta {
  display: inline-flex; align-items: center; gap: 5px;
  font: inherit; font-size: 12.5px; font-weight: 600;
  background: var(--terracotta); color: var(--crema-100);
  border: none; cursor: pointer;
  padding: 8px 12px;
  border-radius: 10px;
  flex-shrink: 0;
  transition: background var(--dur) var(--ease-standard);
}
.stk-crit-cta:hover { background: var(--terracotta-700); }
.stk-crit-cta.done { background: var(--success-bg); color: var(--oliva-700); }
.stk-crit-cta .iconify { width: 13px; height: 13px; }

.stk-inv-title {
  font-size: 15px; font-weight: 600; color: var(--fg1);
  margin: 0 0 4px;
}
.stk-inv-hint { margin: 0 0 12px; font-size: 12px; color: var(--fg3); }

/* ── Aside "Qué hacer ahora": pendientes accionables (no números repetidos) ── */
.stk-todo { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.stk-todo-item {
  display: flex; align-items: center; gap: 9px;
  padding: 10px 0; border-top: 1px solid var(--border-subtle);
  font-size: 13px; color: var(--fg1);
}
.stk-todo-item:first-child { border-top: none; }
.stk-todo-item a, .stk-todo-item button {
  color: inherit; text-decoration: none; background: none; border: none;
  font: inherit; cursor: pointer; text-align: left; padding: 0;
}
.stk-todo-item a:hover, .stk-todo-item button:hover { color: var(--terracotta-700); }
.stk-todo-item .iconify { width: 16px; height: 16px; flex-shrink: 0; }
.stk-todo-item.danger .iconify { color: var(--danger); }
.stk-todo-item.warn .iconify { color: var(--mostaza-700); }
.stk-todo-item.info .iconify { color: var(--espresso-400); }
.stk-todo-item.ok .iconify { color: var(--oliva-700); }
.stk-chip-rail {
  display: flex; gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 12px;
}
.stk-chip-rail::-webkit-scrollbar { display: none; }
.stk-chip {
  display: inline-flex; align-items: center; gap: 5px;
  font: inherit; font-size: 12.5px; font-weight: 500;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--fg2);
  padding: 6px 12px;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background var(--dur) var(--ease-standard), color var(--dur) var(--ease-standard);
}
.stk-chip.active { background: var(--espresso); color: var(--crema-100); border-color: var(--espresso); }
.stk-chip.warn { border-color: var(--mostaza); color: var(--mostaza-700); }
.stk-chip.warn.active { background: var(--mostaza); color: var(--espresso); }
.stk-chip .iconify { width: 12px; height: 12px; }

.stk-inv-list {
  display: flex; flex-direction: column;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--pure-white);
  overflow: hidden;
}
.stk-row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-subtle);
  text-decoration: none;
  transition: background var(--dur) var(--ease-standard);
}
.stk-row:last-child { border-bottom: none; }
.stk-row:hover { background: var(--crema-50); }
.stk-row-ico {
  width: 38px; height: 38px; border-radius: 11px;
  background: var(--crema-100);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.stk-row-body { flex: 1; min-width: 0; }
.stk-row-name { font-size: 14px; font-weight: 600; color: var(--fg1); }
.stk-row-cat { font-size: 11px; color: var(--fg3); margin-top: 1px; }
.stk-row-stock { font-size: 12px; color: var(--fg2); font-variant-numeric: tabular-nums; margin-top: 1px; }
.stk-row-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.stk-status-dot {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 10.5px; font-weight: 700;
  padding: 3px 8px; border-radius: 999px;
}
.stk-status-dot .d { width: 6px; height: 6px; border-radius: 50%; }
.stk-status-dot.ok { background: var(--success-bg); color: var(--oliva-700); }
.stk-status-dot.ok .d { background: var(--oliva); }
.stk-status-dot.low { background: var(--warning-bg); color: var(--mostaza-700); }
.stk-status-dot.low .d { background: var(--mostaza); }
.stk-status-dot.crit { background: var(--danger-bg); color: var(--danger); }
.stk-status-dot.crit .d { background: var(--danger); }
.stk-row-cost { font-size: 11px; color: var(--fg3); font-family: var(--font-mono); }
.stk-row-cost.missing {
  display: inline-flex; align-items: center; gap: 4px;
  color: var(--mostaza-700); font-weight: 600;
}
.stk-row-cost.missing .iconify { width: 11px; height: 11px; }
</style>
