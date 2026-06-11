<script setup lang="ts">
import type { ChatMessage } from '#shared/types/domain'

definePageMeta({ layout: 'app' })
useSeoMeta({ title: 'Chat IA — GastronomIA' })

const { user } = useUserSession()
const toast = useToast()
const { messages, streaming, ask, stop } = useChatStream()

const firstName = computed(() => user.value?.name.split(' ')[0] ?? '')
const initials = computed(() =>
  (user.value?.name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase(),
)

// ===== Sugerencias =====
interface Suggestion {
  id: string
  emoji: string
  label: string
  ex: string
}

const SUGGESTIONS_PRIMARY: Suggestion[] = [
  { id: 's1', emoji: '📊', label: 'Ventas del día', ex: '¿Cuánto vendí hoy?' },
  { id: 's2', emoji: '🏆', label: 'Plato más vendido', ex: '¿Cuál es mi top de la semana?' },
  { id: 's3', emoji: '📦', label: 'Stock crítico', ex: '¿Qué insumos están por agotarse?' },
  { id: 's4', emoji: '💰', label: 'Margen promedio', ex: '¿Cuál es mi margen real?' },
]

const SUGGESTIONS_MORE: Suggestion[] = [
  { id: 's5', emoji: '📈', label: 'Tendencia semanal', ex: '¿Cómo va la semana vs la anterior?' },
  { id: 's6', emoji: '🎯', label: 'Ticket promedio', ex: '¿Cómo está mi ticket promedio?' },
  { id: 's7', emoji: '🥇', label: 'Plato más rentable', ex: '¿Cuál es mi plato con mejor margen?' },
  { id: 's8', emoji: '📅', label: 'Mes vs mes', ex: 'Compara este mes con el anterior' },
]

const suggestionsExpanded = ref(false)
const visibleSuggestions = computed(() =>
  suggestionsExpanded.value ? [...SUGGESTIONS_PRIMARY, ...SUGGESTIONS_MORE] : SUGGESTIONS_PRIMARY,
)

function pickSuggestion(question: string): void {
  ask(question)
}

// ===== Input =====
const PLACEHOLDERS = [
  'Pregúntame algo…',
  'Ej: ¿cuál es mi plato más rentable?',
  'Ej: ¿qué insumos están por agotarse?',
  'Ej: comparar esta semana con la anterior',
]

const text = ref('')
const placeholderIdx = ref(0)
const inputEl = ref<HTMLTextAreaElement | null>(null)
let placeholderTimer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  placeholderTimer = setInterval(() => {
    if (!text.value) placeholderIdx.value = (placeholderIdx.value + 1) % PLACEHOLDERS.length
  }, 4000)
})
onBeforeUnmount(() => clearInterval(placeholderTimer))

const hasText = computed(() => text.value.trim().length > 0)

watch(text, () => {
  const el = inputEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 100)}px`
})

function send(): void {
  const question = text.value.trim()
  if (!question || streaming.value) return
  text.value = ''
  ask(question)
}

function onMic(): void {
  toast.add({ title: 'Dictado por voz · Próximamente', icon: 'i-lucide-mic' })
}

// ===== Auto-scroll en cada chunk =====
watch(messages, () => {
  if (!import.meta.client) return
  requestAnimationFrame(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight })
  })
}, { deep: true, flush: 'post' })

// ===== Render de **bold** sin librerías =====
interface TextSegment {
  text: string
  bold: boolean
}

function boldSegments(content: string): TextSegment[] {
  return content
    .split('**')
    .map((segment, index) => ({ text: segment, bold: index % 2 === 1 }))
    .filter(segment => segment.text.length > 0)
}

// ===== Bloque SQL colapsable =====
const collapsedSql = reactive<Record<string, boolean>>({})

function toggleSql(id: string): void {
  collapsedSql[id] = !collapsedSql[id]
}

function showTyping(message: ChatMessage, index: number): boolean {
  return message.role === 'assistant'
    && streaming.value
    && index === messages.value.length - 1
    && !message.content
}

// ===== Opciones del chat =====
const optionsOpen = ref(false)
const confirmClearOpen = ref(false)

function requestClear(): void {
  optionsOpen.value = false
  confirmClearOpen.value = true
}

function soon(label: string): void {
  optionsOpen.value = false
  toast.add({ title: `${label} · Próximamente`, icon: 'i-lucide-sparkles' })
}

function confirmClear(): void {
  stop()
  messages.value = []
  text.value = ''
  confirmClearOpen.value = false
  toast.add({ title: 'Conversación limpiada', icon: 'i-lucide-trash-2' })
}
</script>

<template>
  <div class="chat-page">
    <!-- ============ Header ============ -->
    <header class="chat-hdr">
      <div class="chat-avatar" aria-hidden="true">
        <img src="/img/logo-symbol.svg" alt="">
      </div>
      <div class="chat-titles">
        <h1 class="chat-title">Gastronom<span class="ia">IA</span></h1>
        <div class="chat-subtitle">
          <span class="live-dot" aria-hidden="true" />
          Tu asistente de cocina IA
        </div>
      </div>
      <button class="icon-btn" aria-label="Más opciones" @click="optionsOpen = true">
        <UIcon name="i-lucide-more-horizontal" />
      </button>
    </header>

    <!-- ============ Banner aprendizaje ============ -->
    <div class="learn-banner" role="status">
      <UIcon name="i-lucide-sparkles" aria-hidden="true" />
      <span>
        <b>Modo aprendizaje</b>
        <span class="learn-sep"> · </span>
        Pronto entenderé más preguntas
      </span>
    </div>

    <!-- ============ Conversación ============ -->
    <div class="chat-body" aria-live="polite">
      <!-- Estado inicial: bienvenida + sugerencias -->
      <template v-if="messages.length === 0">
        <div class="msg-row ai">
          <div class="msg-avatar" aria-hidden="true">
            <img src="/img/logo-symbol.svg" alt="">
          </div>
          <div class="msg-stack">
            <div class="bubble">
              ¡Hola, <b>{{ firstName }}</b>! 👋 Soy <b>GastronomIA</b>, tu asistente inteligente.
              Puedo ayudarte a entender tus ventas, márgenes, stock y más. Empieza preguntándome
              algo o usa una de estas sugerencias:
            </div>
          </div>
        </div>

        <div class="sugg-block">
          <div class="sugg-header">
            <UIcon name="i-lucide-lightbulb" /> Pregúntame sobre
          </div>
          <div class="sugg-grid">
            <button
              v-for="s in visibleSuggestions"
              :key="s.id"
              type="button"
              class="sugg-card"
              :aria-label="`${s.label}: ${s.ex}`"
              @click="pickSuggestion(s.ex)"
            >
              <span class="emoji" aria-hidden="true">{{ s.emoji }}</span>
              <span class="label">{{ s.label }}</span>
              <span class="ex">{{ s.ex }}</span>
            </button>
          </div>
          <div class="sugg-more-wrap">
            <button
              type="button"
              class="sugg-more"
              :class="{ open: suggestionsExpanded }"
              :aria-expanded="suggestionsExpanded"
              @click="suggestionsExpanded = !suggestionsExpanded"
            >
              {{ suggestionsExpanded ? 'Ver menos' : 'Ver más sugerencias' }}
              <UIcon name="i-lucide-chevron-down" />
            </button>
          </div>
        </div>
      </template>

      <!-- Conversación activa -->
      <template v-else>
        <div class="date-sep" aria-label="Hoy">Hoy</div>

        <div
          v-for="(m, index) in messages"
          :key="m.id"
          class="msg-row"
          :class="m.role === 'user' ? 'me' : 'ai'"
        >
          <div class="msg-avatar" aria-hidden="true">
            <img v-if="m.role === 'assistant'" src="/img/logo-symbol.svg" alt="">
            <template v-else>{{ initials }}</template>
          </div>
          <div class="msg-stack">
            <div class="bubble">
              <!-- 1. SQL generado (colapsable) -->
              <div v-if="m.sql" class="sql-block">
                <button
                  type="button"
                  class="sql-head"
                  :aria-expanded="!collapsedSql[m.id]"
                  @click="toggleSql(m.id)"
                >
                  <UIcon name="i-lucide-database" />
                  SQL generado
                  <UIcon
                    name="i-lucide-chevron-down"
                    class="sql-chev"
                    :class="{ open: !collapsedSql[m.id] }"
                  />
                </button>
                <pre v-show="!collapsedSql[m.id]" class="sql-code">{{ m.sql }}</pre>
              </div>

              <!-- 2. Tabla de resultados -->
              <div v-if="m.table" class="result-wrap">
                <table class="result-table">
                  <thead>
                    <tr>
                      <th v-for="col in m.table.columns" :key="col">{{ col }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, ri) in m.table.rows" :key="ri">
                      <td v-for="(cell, ci) in row" :key="ci">{{ cell }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- 3. Respuesta en texto (con **bold**) -->
              <p v-if="m.content" class="bubble-text">
                <template v-for="(seg, si) in boldSegments(m.content)" :key="si">
                  <b v-if="seg.bold">{{ seg.text }}</b>
                  <template v-else>{{ seg.text }}</template>
                </template>
              </p>

              <!-- Escribiendo… -->
              <div v-if="showTyping(m, index)" class="typing" aria-label="GastronomIA está escribiendo">
                <span /><span /><span />
              </div>
            </div>
            <span class="msg-time">{{ formatTime(m.createdAt) }}</span>
          </div>
        </div>
      </template>
    </div>

    <!-- ============ Input fijo ============ -->
    <div class="input-bar">
      <div class="input-inner">
        <div class="input-card">
          <button type="button" class="mic-btn" aria-label="Dictar mensaje por voz" @click="onMic">
            <UIcon name="i-lucide-mic" />
          </button>
          <textarea
            ref="inputEl"
            v-model="text"
            class="text-input"
            :placeholder="PLACEHOLDERS[placeholderIdx]"
            rows="1"
            aria-label="Escribe tu pregunta"
            @keydown.enter.exact.prevent="send"
          />
          <button
            v-if="streaming"
            type="button"
            class="send-btn stop"
            aria-label="Detener respuesta"
            @click="stop"
          >
            <UIcon name="i-lucide-square" />
          </button>
          <button
            v-else
            type="button"
            class="send-btn"
            :class="{ active: hasText }"
            :disabled="!hasText"
            aria-label="Enviar pregunta"
            @click="send"
          >
            <UIcon name="i-lucide-send" />
          </button>
        </div>
      </div>
    </div>

    <!-- ============ Sheet de opciones ============ -->
    <UiBottomSheet v-model="optionsOpen" title="Opciones del chat">
      <div class="sheet-rows">
        <button type="button" class="sheet-row danger" @click="requestClear">
          <UIcon name="i-lucide-trash-2" /> Limpiar conversación
        </button>
        <button type="button" class="sheet-row" @click="soon('Historial completo')">
          <UIcon name="i-lucide-history" /> Historial completo
        </button>
        <button type="button" class="sheet-row" @click="soon('Configurar IA')">
          <UIcon name="i-lucide-settings-2" /> Configurar IA
        </button>
      </div>
    </UiBottomSheet>

    <!-- ============ Confirmación limpiar ============ -->
    <UiBottomSheet v-model="confirmClearOpen" title="¿Limpiar la conversación?">
      <p class="confirm-text">
        Volverás al estado inicial con el mensaje de bienvenida. Esta acción no se puede deshacer.
      </p>
      <template #cta>
        <div class="confirm-actions">
          <button class="btn btn-ghost" type="button" @click="confirmClearOpen = false">Cancelar</button>
          <button class="btn btn-primary" type="button" @click="confirmClear">Limpiar</button>
        </div>
      </template>
    </UiBottomSheet>
  </div>
</template>

<style scoped>
.chat-page {
  max-width: 760px;
  margin: 0 auto;
}

/* ============ Header ============ */
.chat-hdr {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: calc(12px + env(safe-area-inset-top, 0px)) 20px 12px;
  display: flex; align-items: center; gap: 12px;
  background: rgba(243, 237, 228, 0.72);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid var(--border-subtle);
}
@media (min-width: 1024px) {
  .chat-hdr { padding-top: 28px; }
}
.chat-avatar {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: radial-gradient(120% 120% at 15% 15%, var(--terracotta-300) 0%, var(--terracotta) 55%, var(--terracotta-700) 100%);
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  position: relative;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 2px 6px rgba(168, 84, 47, 0.18);
}
.chat-avatar img {
  width: 28px; height: 28px;
  display: block;
  filter: brightness(0) invert(1);
  opacity: 0.95;
}
.chat-avatar::after {
  content: '';
  position: absolute;
  bottom: -2px; right: -2px;
  width: 12px; height: 12px;
  border-radius: 50%;
  background: var(--oliva);
  border: 2px solid var(--crema);
}
.chat-titles { flex: 1; min-width: 0; line-height: 1.1; }
.chat-title {
  font-size: 18px; font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--fg1);
  margin: 0;
}
.chat-title .ia { color: var(--terracotta-700); }
.chat-subtitle {
  font-size: 12px; color: var(--fg3);
  margin-top: 3px;
  display: flex; align-items: center; gap: 6px;
}
.live-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--oliva);
  display: inline-block;
}
.icon-btn {
  width: 38px; height: 38px; border-radius: 10px;
  background: var(--pure-white);
  border: 1px solid var(--border-subtle);
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: var(--fg2);
  flex-shrink: 0;
  transition: background var(--dur) var(--ease-standard), color var(--dur) var(--ease-standard);
}
.icon-btn:hover { background: var(--crema-200); color: var(--fg1); }
.icon-btn:active { transform: scale(0.96); }
.icon-btn .iconify { width: 18px; height: 18px; }

/* ============ Banner aprendizaje ============ */
.learn-banner {
  margin: 8px 20px 0;
  background: var(--mostaza-100);
  border: 1px solid rgba(176, 130, 46, 0.18);
  border-radius: 10px;
  padding: 8px 12px;
  display: flex; align-items: center; gap: 10px;
  font-size: 12px;
  color: var(--mostaza-700);
}
.learn-banner .iconify { width: 14px; height: 14px; flex-shrink: 0; }
.learn-banner b { color: var(--espresso-800); font-weight: 600; }
.learn-sep { color: rgba(176, 130, 46, 0.5); }

/* ============ Conversación ============ */
.chat-body {
  padding: 16px 20px 96px;
  display: flex; flex-direction: column; gap: 14px;
}

.date-sep {
  display: flex; align-items: center; gap: 10px;
  color: var(--fg3);
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin: 6px 4px;
}
.date-sep::before,
.date-sep::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-subtle);
}

.msg-row {
  display: flex; gap: 8px;
  max-width: 92%;
  align-items: flex-end;
}
.msg-row.ai { align-self: flex-start; }
.msg-row.me { align-self: flex-end; flex-direction: row-reverse; }

.msg-avatar {
  width: 26px; height: 26px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
  margin-bottom: 4px;
}
.msg-row.ai .msg-avatar {
  background: radial-gradient(120% 120% at 15% 15%, var(--terracotta-300) 0%, var(--terracotta) 55%, var(--terracotta-700) 100%);
  color: var(--crema-100);
  padding: 4px;
}
.msg-row.ai .msg-avatar img {
  width: 100%; height: 100%;
  filter: brightness(0) invert(1);
  opacity: 0.95;
}
.msg-row.me .msg-avatar {
  background: var(--espresso-800);
  color: var(--crema-100);
}

.msg-stack {
  display: flex; flex-direction: column;
  gap: 4px;
  min-width: 0;
  max-width: 100%;
}
.msg-row.me .msg-stack { align-items: flex-end; }

.bubble {
  font-size: 14px;
  line-height: 1.5;
  padding: 10px 14px;
  border-radius: 14px;
  max-width: 100%;
  word-wrap: break-word;
}
.msg-row.ai .bubble {
  background: var(--pure-white);
  border: 1px solid var(--border-subtle);
  color: var(--fg1);
  border-top-left-radius: 4px;
}
.msg-row.me .bubble {
  background: var(--espresso-800);
  color: var(--crema-100);
  border-top-right-radius: 4px;
}
.bubble b { font-weight: 600; }
.bubble-text { margin: 0; }

.msg-time {
  font-size: 10.5px;
  color: var(--fg3);
  font-family: var(--font-mono);
  padding: 0 4px;
}

/* ============ Bloque SQL ============ */
.sql-block {
  margin: 2px 0 10px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--espresso-800);
}
.sql-head {
  width: 100%;
  display: flex; align-items: center; gap: 6px;
  padding: 8px 10px;
  background: transparent;
  border: none;
  color: var(--crema-200);
  font-family: inherit;
  font-size: 10.5px; font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}
.sql-head .iconify { width: 13px; height: 13px; }
.sql-chev {
  margin-left: auto;
  transition: transform var(--dur) var(--ease-standard);
}
.sql-chev.open { transform: rotate(180deg); }
.sql-code {
  margin: 0;
  padding: 10px 12px;
  font-family: var(--font-mono);
  font-size: 11.5px;
  line-height: 1.55;
  color: #E8DFD2;
  white-space: pre-wrap;
  word-break: break-word;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

/* ============ Tabla de resultados ============ */
.result-wrap {
  margin: 2px 0 10px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  overflow-x: auto;
}
.result-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}
.result-table th {
  background: var(--crema-100);
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--fg3);
  text-align: left;
  padding: 7px 10px;
  white-space: nowrap;
}
.result-table td {
  padding: 7px 10px;
  border-top: 1px solid var(--border-subtle);
  color: var(--fg1);
  white-space: nowrap;
}
.result-table td:not(:first-child) {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--fg2);
}

/* ============ Typing ============ */
.typing {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 0;
}
.typing span {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--terracotta);
  opacity: 0.4;
  animation: typingBounce 1.2s var(--ease-standard) infinite;
}
.typing span:nth-child(2) { animation-delay: 0.15s; }
.typing span:nth-child(3) { animation-delay: 0.3s; }
@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}

/* ============ Sugerencias ============ */
.sugg-block { margin-top: 6px; }
.sugg-header {
  font-size: 12px; font-weight: 600;
  color: var(--fg2);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  display: flex; align-items: center; gap: 6px;
  margin: 18px 4px 10px;
}
.sugg-header .iconify { width: 14px; height: 14px; color: var(--mostaza-700); }

.sugg-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
@media (min-width: 640px) {
  .sugg-grid { grid-template-columns: repeat(4, 1fr); }
}
.sugg-card {
  background: var(--pure-white);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 12px;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  display: flex; flex-direction: column; gap: 4px;
  min-height: 86px;
  transition: border-color var(--dur), background var(--dur), transform 80ms;
}
.sugg-card:hover { border-color: var(--terracotta-300); background: var(--crema-50); }
.sugg-card:active { transform: scale(0.98); }
.sugg-card .emoji { font-size: 18px; line-height: 1; margin-bottom: 2px; }
.sugg-card .label {
  font-size: 14px; font-weight: 600;
  color: var(--fg1);
  letter-spacing: -0.01em;
}
.sugg-card .ex {
  font-size: 12px; color: var(--fg3);
  line-height: 1.35;
}

.sugg-more-wrap { display: flex; justify-content: center; }
.sugg-more {
  margin-top: 10px;
  background: transparent;
  border: none;
  color: var(--terracotta-700);
  font-family: inherit;
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  padding: 8px 12px;
  display: inline-flex; align-items: center; gap: 6px;
}
.sugg-more:hover { color: var(--terracotta); }
.sugg-more .iconify { width: 14px; height: 14px; transition: transform var(--dur); }
.sugg-more.open .iconify { transform: rotate(180deg); }

/* ============ Input bar fija ============ */
.input-bar {
  position: fixed;
  left: 0; right: 0;
  bottom: calc(68px + env(safe-area-inset-bottom, 0px));
  z-index: 30;
  padding: 8px 12px 10px;
  background: linear-gradient(to bottom, rgba(243, 237, 228, 0) 0%, var(--crema-100) 30%);
}
@media (min-width: 1024px) {
  .input-bar {
    left: 256px;
    bottom: 0;
    padding: 12px 24px 24px;
  }
  .chat-body { padding-bottom: 110px; }
}
.input-inner {
  max-width: 720px;
  margin: 0 auto;
}
.input-card {
  background: var(--pure-white);
  border: 1px solid var(--border-subtle);
  border-radius: 22px;
  padding: 6px 6px 6px 10px;
  display: flex; align-items: center; gap: 6px;
  box-shadow: 0 2px 8px rgba(26, 26, 26, 0.04);
  transition: border-color var(--dur);
}
.input-card:focus-within {
  border-color: var(--terracotta-300);
  box-shadow: 0 0 0 3px rgba(201, 106, 67, 0.12), 0 2px 8px rgba(26, 26, 26, 0.04);
}
.mic-btn {
  width: 34px; height: 34px;
  border-radius: 50%;
  background: var(--crema-100);
  border: none;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--fg2);
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--dur);
}
.mic-btn:hover { background: var(--crema-200); color: var(--fg1); }
.mic-btn .iconify { width: 16px; height: 16px; }

.text-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  color: var(--fg1);
  padding: 8px 4px;
  resize: none;
  max-height: 100px;
  line-height: 1.4;
}
.text-input::placeholder { color: var(--fg3); }

.send-btn {
  width: 34px; height: 34px;
  border-radius: 50%;
  background: var(--crema-200);
  border: none;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--fg3);
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--dur), color var(--dur), transform 80ms;
}
.send-btn.active {
  background: var(--terracotta);
  color: var(--crema-100);
}
.send-btn.active:hover { background: var(--terracotta-700); }
.send-btn:active { transform: scale(0.94); }
.send-btn.stop {
  background: var(--espresso-800);
  color: var(--crema-100);
}
.send-btn .iconify { width: 16px; height: 16px; }

/* ============ Sheets ============ */
.sheet-rows { display: flex; flex-direction: column; }
.sheet-row {
  width: 100%;
  display: flex; align-items: center; gap: 12px;
  padding: 14px 12px;
  background: transparent;
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-size: 15px; font-weight: 500;
  color: var(--fg1);
  cursor: pointer;
  text-align: left;
}
.sheet-row:hover { background: var(--crema-200); }
.sheet-row.danger { color: var(--danger); }
.sheet-row .iconify { width: 18px; height: 18px; }
.sheet-row + .sheet-row { border-top: 1px solid var(--border-subtle); }

.confirm-text {
  margin: 0;
  font-size: 13.5px;
  color: var(--fg2);
  line-height: 1.5;
}
.confirm-actions {
  display: flex; gap: 8px; justify-content: flex-end;
}
</style>
