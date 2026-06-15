<script setup lang="ts">
// HU-02-11 (modificadores) + HU-02-13 (disponibilidad horaria) de un plato.
const props = defineProps<{ recipeId: string }>()
const toast = useToast()

const { data: modifiers } = useModifiers(() => props.recipeId)
const { mutateAsync: addMod, isLoading: addingMod } = useAddModifier(() => props.recipeId)
const { mutateAsync: removeMod } = useRemoveModifier(() => props.recipeId)

const { data: windows } = useAvailability(() => props.recipeId)
const { mutateAsync: addWin, isLoading: addingWin } = useAddAvailability(() => props.recipeId)
const { mutateAsync: removeWin } = useRemoveAvailability(() => props.recipeId)

/* ---- Modificadores ---- */
const modName = ref('')
const modDelta = ref('0')
const modRequired = ref(false)

async function submitMod(): Promise<void> {
  if (!modName.value.trim()) return
  try {
    await addMod({
      name: modName.value.trim(),
      priceDelta: Number(modDelta.value) || 0,
      required: modRequired.value,
    })
    modName.value = ''
    modDelta.value = '0'
    modRequired.value = false
    toast.add({ title: 'Modificador agregado', icon: 'i-lucide-check-circle-2' })
  }
  catch {
    toast.add({ title: 'No se pudo agregar el modificador', icon: 'i-lucide-alert-triangle', color: 'error' })
  }
}
async function delMod(id: string): Promise<void> {
  await removeMod(id)
  toast.add({ title: 'Modificador eliminado', icon: 'i-lucide-trash-2' })
}
const fmtDelta = (d: number): string =>
  d >= 0 ? `+S/ ${d.toFixed(2)}` : `−S/ ${Math.abs(d).toFixed(2)}`

/* ---- Disponibilidad ---- */
const DAYS = [
  { v: 'null', l: 'Todos los días' },
  { v: '1', l: 'Lunes' },
  { v: '2', l: 'Martes' },
  { v: '3', l: 'Miércoles' },
  { v: '4', l: 'Jueves' },
  { v: '5', l: 'Viernes' },
  { v: '6', l: 'Sábado' },
  { v: '0', l: 'Domingo' },
]
const winDay = ref('null')
const winStart = ref('12:00')
const winEnd = ref('15:00')

const hhmmToMin = (s: string): number => {
  const [h, m] = s.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}
const minToHHMM = (m: number): string =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const dayLabel = (d: number | null): string =>
  d === null ? 'Todos los días' : DAYS.find(x => x.v === String(d))?.l ?? ''

async function submitWin(): Promise<void> {
  const start = hhmmToMin(winStart.value)
  const end = hhmmToMin(winEnd.value)
  if (end <= start) {
    toast.add({ title: 'El fin debe ser mayor que el inicio', icon: 'i-lucide-alert-triangle', color: 'error' })
    return
  }
  try {
    await addWin({
      dayOfWeek: winDay.value === 'null' ? null : Number(winDay.value),
      startMinute: start,
      endMinute: end,
    })
    toast.add({ title: 'Ventana de disponibilidad agregada', icon: 'i-lucide-check-circle-2' })
  }
  catch {
    toast.add({ title: 'No se pudo agregar la ventana', icon: 'i-lucide-alert-triangle', color: 'error' })
  }
}
async function delWin(id: string): Promise<void> {
  await removeWin(id)
  toast.add({ title: 'Ventana eliminada', icon: 'i-lucide-trash-2' })
}
</script>

<template>
  <div class="rx">
    <!-- Modificadores (HU-02-11) -->
    <section class="rx-section">
      <h3 class="rx-title"><UIcon name="i-lucide-sliders-horizontal" /> Modificadores</h3>
      <p class="rx-hint">Opciones del plato (extra queso, sin cebolla…) con su ajuste de precio.</p>

      <ul v-if="modifiers && modifiers.length" class="rx-list">
        <li v-for="m in modifiers" :key="m.id" class="rx-item">
          <div class="rx-item-main">
            <span class="rx-item-name">{{ m.name }}</span>
            <span v-if="m.required" class="rx-badge">Obligatorio</span>
          </div>
          <span class="rx-delta" :class="{ neg: m.priceDelta < 0 }">{{ fmtDelta(m.priceDelta) }}</span>
          <button type="button" class="rx-del" aria-label="Eliminar" @click="delMod(m.id)">
            <UIcon name="i-lucide-x" />
          </button>
        </li>
      </ul>
      <p v-else class="rx-empty">Sin modificadores aún.</p>

      <form class="rx-form" @submit.prevent="submitMod">
        <input v-model="modName" class="rx-input grow" placeholder="Nombre (ej. Extra queso)" aria-label="Nombre del modificador">
        <input v-model="modDelta" type="number" step="0.5" class="rx-input price" aria-label="Δ precio">
        <label class="rx-check"><input v-model="modRequired" type="checkbox"> Oblig.</label>
        <button type="submit" class="rx-add" :disabled="addingMod || !modName.trim()">
          <UIcon name="i-lucide-plus" />
        </button>
      </form>
    </section>

    <!-- Disponibilidad horaria (HU-02-13) -->
    <section class="rx-section">
      <h3 class="rx-title"><UIcon name="i-lucide-clock" /> Disponibilidad por horario</h3>
      <p class="rx-hint">Sin ventanas el plato está disponible siempre. Hora del local (America/Lima).</p>

      <ul v-if="windows && windows.length" class="rx-list">
        <li v-for="w in windows" :key="w.id" class="rx-item">
          <div class="rx-item-main">
            <span class="rx-item-name">{{ dayLabel(w.dayOfWeek) }}</span>
          </div>
          <span class="rx-time">{{ minToHHMM(w.startMinute) }}–{{ minToHHMM(w.endMinute) }}</span>
          <button type="button" class="rx-del" aria-label="Eliminar" @click="delWin(w.id)">
            <UIcon name="i-lucide-x" />
          </button>
        </li>
      </ul>
      <p v-else class="rx-empty">Disponible siempre (sin restricción horaria).</p>

      <form class="rx-form" @submit.prevent="submitWin">
        <select v-model="winDay" class="rx-input grow" aria-label="Día">
          <option v-for="d in DAYS" :key="d.v" :value="d.v">{{ d.l }}</option>
        </select>
        <input v-model="winStart" type="time" class="rx-input time" aria-label="Desde">
        <input v-model="winEnd" type="time" class="rx-input time" aria-label="Hasta">
        <button type="submit" class="rx-add" :disabled="addingWin">
          <UIcon name="i-lucide-plus" />
        </button>
      </form>
    </section>
  </div>
</template>

<style scoped>
.rx { display: flex; flex-direction: column; gap: 18px; }
.rx-section { background: var(--pure-white, #fff); border: 1px solid var(--border); border-radius: 16px; padding: 16px; }
.rx-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; color: var(--fg1); }
.rx-hint { font-size: 12.5px; color: var(--fg2); margin: 4px 0 12px; line-height: 1.45; }
.rx-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.rx-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; background: var(--bg2); border-radius: 11px; }
.rx-item-main { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.rx-item-name { font-weight: 600; font-size: 13.5px; color: var(--fg1); }
.rx-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 999px; background: color-mix(in srgb, var(--mostaza) 22%, transparent); color: var(--mostaza-700); text-transform: uppercase; }
.rx-delta { font-family: var(--font-mono); font-size: 13px; font-weight: 700; color: var(--success); }
.rx-delta.neg { color: var(--danger); }
.rx-time { font-family: var(--font-mono); font-size: 12.5px; color: var(--fg2); }
.rx-del { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 8px; color: var(--fg3); background: transparent; }
.rx-del:hover { background: var(--danger-bg); color: var(--danger); }
.rx-empty { font-size: 12.5px; color: var(--fg3); font-style: italic; margin-bottom: 12px; }
.rx-form { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.rx-input { height: 38px; border: 1px solid var(--border); border-radius: 10px; padding: 0 10px; font-size: 13px; background: var(--pure-white, #fff); color: var(--fg1); }
.rx-input.grow { flex: 1; min-width: 130px; }
.rx-input.price { width: 84px; font-family: var(--font-mono); }
.rx-input.time { width: 104px; font-family: var(--font-mono); }
.rx-check { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--fg2); white-space: nowrap; }
.rx-add { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 10px; background: var(--terracotta); color: #fff; flex-shrink: 0; }
.rx-add:disabled { opacity: 0.5; }
</style>
