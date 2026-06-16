<script setup lang="ts">
// /app/cierre — HU-04-08 · Cierre Z (caja). Muestra el turno abierto (ventas desde
// el último cierre, agregadas por método de pago), permite cerrarlo y lista el
// historial. Es info de gestión: solo owner/manager (el backend 403ea a staff).
definePageMeta({ layout: 'app' })
useSeoMeta({ title: 'Cierre de caja — GastronomIA' })

const { user } = useUserSession()
const toast = useToast()

const canView = computed(() => user.value?.role === 'owner' || user.value?.role === 'manager')

const { data: preview, isLoading: loadingPreview } = useCashClosePreview()
const { data: closes, isLoading: loadingCloses } = useCashCloses()
const { mutateAsync: doClose, isLoading: closing } = useDoCashClose()

const METHODS: Array<{ key: 'cash' | 'card' | 'yape' | 'plin', label: string, icon: string }> = [
  { key: 'cash', label: 'Efectivo', icon: 'i-lucide-banknote' },
  { key: 'card', label: 'Tarjeta', icon: 'i-lucide-credit-card' },
  { key: 'yape', label: 'Yape', icon: 'i-lucide-smartphone' },
  { key: 'plin', label: 'Plin', icon: 'i-lucide-smartphone' },
]

const hasSales = computed(() => (preview.value?.salesCount ?? 0) > 0)
const confirmOpen = ref(false)

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}
function money(s: string | null | undefined): string {
  return formatPEN(Number(s ?? 0))
}

async function confirmClose(): Promise<void> {
  if (closing.value) return
  try {
    const res = await doClose()
    confirmOpen.value = false
    toast.add({
      title: 'Turno cerrado (Cierre Z)',
      description: `${res.salesCount} venta(s) · ${money(res.totalGross)}`,
      icon: 'i-lucide-badge-check',
    })
  }
  catch (e) {
    const err = e as { data?: { message?: string }, statusMessage?: string }
    toast.add({
      title: 'No se pudo cerrar el turno',
      description: err.data?.message ?? err.statusMessage ?? 'Intenta de nuevo',
      icon: 'i-lucide-alert-triangle',
      color: 'error',
    })
  }
}
</script>

<template>
  <div class="cz-screen">
    <UiScreenHeader title="Cierre de caja" subtitle="Cierre Z del turno" back="/app/menu" />

    <!-- Sin permiso (staff) -->
    <UiEmptyState
      v-if="!canView"
      icon="i-lucide-lock"
      title="Sin acceso al cierre de caja"
      subtitle="El arqueo y el Cierre Z son información de gestión: solo el propietario y el encargado pueden verlos."
    />

    <template v-else>
      <!-- Turno abierto (preview, no persiste) -->
      <section class="cz-card cz-preview" aria-label="Turno abierto">
        <div class="cz-head">
          <span class="cz-eyebrow">Turno abierto</span>
          <span class="cz-since">
            {{ hasSales ? `Desde ${fmtDateTime(preview?.openSince ?? preview?.periodStart)}` : 'Sin ventas en este turno' }}
          </span>
        </div>

        <div class="cz-total">
          <span class="cur">S/</span>
          <span class="num">{{ Number(preview?.totalGross ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2 }) }}</span>
        </div>
        <div class="cz-total-label">
          Total bruto · <b>{{ preview?.salesCount ?? 0 }}</b> venta(s)<template v-if="(preview?.voidCount ?? 0) > 0"> · {{ preview?.voidCount }} anulada(s)</template>
        </div>

        <div class="cz-methods">
          <div v-for="m in METHODS" :key="m.key" class="cz-method">
            <span class="cz-method-ico"><UIcon :name="m.icon" /></span>
            <span class="cz-method-lbl">{{ m.label }}</span>
            <span class="cz-method-val">{{ money(preview?.byMethod?.[m.key]) }}</span>
          </div>
        </div>

        <button class="cz-close-btn" :disabled="!hasSales || loadingPreview" @click="confirmOpen = true">
          <UIcon name="i-lucide-lock" /> Cerrar turno (Z)
        </button>
        <p v-if="!hasSales" class="cz-hint">No hay ventas para cerrar todavía.</p>
      </section>

      <!-- Historial -->
      <section class="cz-history">
        <h2 class="cz-history-title">Cierres anteriores</h2>
        <div v-if="loadingCloses" class="cz-muted">Cargando…</div>
        <UiEmptyState
          v-else-if="!closes || closes.length === 0"
          icon="i-lucide-archive"
          title="Aún no hay cierres"
          subtitle="Cuando cierres el turno, el Cierre Z quedará registrado aquí."
        />
        <ul v-else class="cz-list">
          <li v-for="c in closes" :key="c.id" class="cz-item">
            <div class="cz-item-main">
              <span class="cz-item-date">{{ fmtDateTime(c.closedAt) }}</span>
              <span class="cz-item-sub">{{ c.salesCount }} venta(s)<template v-if="c.voidCount > 0"> · {{ c.voidCount }} anulada(s)</template></span>
            </div>
            <span class="cz-item-total">{{ money(c.totalGross) }}</span>
          </li>
        </ul>
      </section>
    </template>

    <!-- Confirmar cierre -->
    <UiBottomSheet
      v-model="confirmOpen"
      title="Cerrar turno (Cierre Z)"
      subtitle="Es definitivo: registra el total del turno y abre uno nuevo."
    >
      <div class="cz-confirm">
        <div class="cz-confirm-row"><span>Ventas</span><b>{{ preview?.salesCount ?? 0 }}</b></div>
        <div class="cz-confirm-row total"><span>Total bruto</span><b>{{ money(preview?.totalGross) }}</b></div>
      </div>
      <template #cta>
        <button class="cz-confirm-btn" :disabled="closing" @click="confirmClose">
          <UIcon :name="closing ? 'i-lucide-loader-circle' : 'i-lucide-check'" :class="{ spin: closing }" />
          {{ closing ? 'Cerrando…' : 'Confirmar Cierre Z' }}
        </button>
      </template>
    </UiBottomSheet>
  </div>
</template>

<style scoped>
.cz-screen { max-width: 560px; margin: 0 auto; padding-bottom: 32px; }

.cz-card {
  background: var(--pure-white);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 18px 16px;
  margin: 0 16px 20px;
}
.cz-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.cz-eyebrow {
  font-size: 11.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--terracotta-700);
}
.cz-since { font-size: 11.5px; color: var(--fg3); text-align: right; }

.cz-total { text-align: center; margin-top: 14px; display: flex; align-items: baseline; justify-content: center; gap: 6px; }
.cz-total .cur { font-size: 20px; font-weight: 500; color: var(--fg3); }
.cz-total .num { font-size: 44px; font-weight: 600; letter-spacing: -0.04em; color: var(--fg1); font-variant-numeric: tabular-nums; }
.cz-total-label { text-align: center; font-size: 12px; color: var(--fg3); margin-top: 4px; }
.cz-total-label b { color: var(--fg2); }

.cz-methods { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 18px 0 16px; }
.cz-method {
  display: flex; align-items: center; gap: 8px;
  background: var(--crema-50);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 10px 12px;
}
.cz-method-ico { color: var(--terracotta-700); display: inline-flex; }
.cz-method-ico .iconify { width: 16px; height: 16px; }
.cz-method-lbl { font-size: 13px; color: var(--fg2); flex: 1; }
.cz-method-val { font-size: 13.5px; font-weight: 600; color: var(--fg1); font-variant-numeric: tabular-nums; }

.cz-close-btn {
  width: 100%;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  background: var(--espresso); color: var(--crema-100);
  border: none; border-radius: 12px;
  padding: 14px; font: inherit; font-size: 15px; font-weight: 600;
  cursor: pointer;
  transition: opacity var(--dur) var(--ease-standard);
}
.cz-close-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.cz-close-btn .iconify { width: 17px; height: 17px; }
.cz-hint { text-align: center; font-size: 12px; color: var(--fg3); margin: 8px 0 0; }

.cz-history { padding: 0 16px; }
.cz-history-title { font-size: 14px; font-weight: 600; color: var(--fg2); margin: 0 0 10px; }
.cz-muted { font-size: 13px; color: var(--fg3); }
.cz-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.cz-item {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  background: var(--pure-white);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 12px 14px;
}
.cz-item-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.cz-item-date { font-size: 13.5px; font-weight: 600; color: var(--fg1); }
.cz-item-sub { font-size: 11.5px; color: var(--fg3); }
.cz-item-total { font-size: 14px; font-weight: 600; color: var(--fg1); font-variant-numeric: tabular-nums; white-space: nowrap; }

.cz-confirm { display: flex; flex-direction: column; gap: 6px; padding: 4px 0 8px; }
.cz-confirm-row { display: flex; justify-content: space-between; font-size: 14px; color: var(--fg2); padding: 4px 0; }
.cz-confirm-row.total { border-top: 1px solid var(--border-subtle); margin-top: 4px; padding-top: 10px; font-size: 15px; }
.cz-confirm-row b { color: var(--fg1); font-variant-numeric: tabular-nums; }
.cz-confirm-btn {
  width: 100%;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  background: var(--espresso); color: var(--crema-100);
  border: none; border-radius: 12px;
  padding: 14px; font: inherit; font-size: 15px; font-weight: 600;
  cursor: pointer;
}
.cz-confirm-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.cz-confirm-btn .iconify { width: 17px; height: 17px; }
.spin { animation: spinAnim 0.9s linear infinite; }
@keyframes spinAnim { to { transform: rotate(360deg); } }
</style>
