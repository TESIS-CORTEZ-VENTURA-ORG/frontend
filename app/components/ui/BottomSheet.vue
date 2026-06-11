<script setup lang="ts">
const props = defineProps<{
  title?: string
  subtitle?: string
}>()

const open = defineModel<boolean>({ required: true })
const closing = ref(false)

function close(): void {
  if (closing.value || !open.value) return
  closing.value = true
  setTimeout(() => {
    open.value = false
    closing.value = false
  }, 190)
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') close()
}

watch(open, (isOpen) => {
  if (import.meta.client) {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  }
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  if (import.meta.client) document.body.style.overflow = ''
})

defineExpose({ close })
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="sheet-overlay" :class="{ closing }" aria-hidden="true" @click="close" />
    <div
      v-if="open"
      class="sheet"
      :class="{ closing }"
      role="dialog"
      aria-modal="true"
      :aria-label="props.title"
    >
      <div class="sheet-handle" aria-hidden="true" />
      <div v-if="props.title || $slots.header" class="sheet-hdr">
        <div class="sheet-hdr-body">
          <slot name="header">
            <h2 class="sheet-title">{{ props.title }}</h2>
            <div v-if="props.subtitle" class="sheet-sub">{{ props.subtitle }}</div>
          </slot>
        </div>
        <button class="sheet-close" aria-label="Cerrar" @click="close">
          <UIcon name="i-lucide-x" />
        </button>
      </div>
      <div class="sheet-body">
        <slot :close="close" />
      </div>
      <div v-if="$slots.cta" class="sheet-cta">
        <slot name="cta" :close="close" />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.sheet-overlay {
  position: fixed; inset: 0;
  background: rgba(26, 26, 26, 0.45);
  z-index: 50;
  opacity: 0;
  animation: ovIn 220ms var(--ease-standard) forwards;
}
.sheet-overlay.closing { animation: ovOut 180ms var(--ease-standard) forwards; }
@keyframes ovIn { to { opacity: 1; } }
@keyframes ovOut { to { opacity: 0; } }

.sheet {
  position: fixed; left: 0; right: 0; bottom: 0;
  margin: 0 auto;
  max-width: 560px;
  background: var(--crema-100);
  border-radius: 20px 20px 0 0;
  z-index: 51;
  padding: 8px 20px calc(20px + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.18);
  transform: translateY(100%);
  animation: shIn 280ms var(--ease-emphasis) forwards;
  display: flex; flex-direction: column;
  max-height: 86dvh;
}
.sheet.closing { animation: shOut 200ms var(--ease-standard) forwards; }
@keyframes shIn { to { transform: translateY(0); } }
@keyframes shOut { to { transform: translateY(100%); } }

@media (min-width: 1024px) {
  .sheet {
    bottom: 32px;
    border-radius: 20px;
    box-shadow: var(--shadow-lg);
  }
}

.sheet-handle {
  width: 36px; height: 4px; border-radius: 999px;
  background: rgba(26, 26, 26, 0.18);
  margin: 6px auto 14px;
  flex-shrink: 0;
}
@media (min-width: 1024px) {
  .sheet-handle { visibility: hidden; }
}

.sheet-hdr {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 12px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 18px;
  flex-shrink: 0;
}
.sheet-hdr-body { flex: 1; min-width: 0; }
.sheet-title {
  font-size: 22px; font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--fg1); line-height: 1.15;
  margin: 0;
}
.sheet-sub {
  margin-top: 4px;
  font-size: 13px; color: var(--fg2);
  display: inline-flex; align-items: center; gap: 6px;
}
.sheet-close {
  width: 36px; height: 36px; border-radius: 999px;
  background: var(--pure-white); border: 1px solid var(--border-subtle);
  color: var(--fg2); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.sheet-close:hover { background: var(--crema-200); color: var(--fg1); }
.sheet-close .iconify { width: 16px; height: 16px; }

.sheet-body { flex: 1; overflow-y: auto; padding-right: 2px; min-height: 0; }

.sheet-cta {
  margin-top: 4px;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
}
</style>
