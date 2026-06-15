<script setup lang="ts">
// E07 · Estado de error de un reporte (fallo de red / backend). Ofrece reintentar.
defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="rep-error">
    <span class="rep-error-ico" aria-hidden="true"><UIcon name="i-lucide-cloud-off" /></span>
    <p class="rep-error-title">No se pudo cargar el reporte</p>
    <p class="rep-error-sub">Revisa tu conexión e inténtalo de nuevo.</p>
    <button class="rep-error-btn" @click="$emit('retry')">
      <UIcon name="i-lucide-refresh-cw" /> Reintentar
    </button>
  </div>
</template>

<style scoped>
.rep-error {
  display: flex; flex-direction: column; align-items: center; text-align: center;
  padding: 40px 24px;
}
.rep-error-ico {
  width: 52px; height: 52px; border-radius: 14px;
  background: var(--danger-bg); color: var(--danger);
  display: inline-flex; align-items: center; justify-content: center;
  margin-bottom: 12px;
}
.rep-error-ico :deep(svg) { width: 24px; height: 24px; }
.rep-error-title { font-size: 15px; font-weight: 600; color: var(--fg1); margin: 0; }
.rep-error-sub { font-size: 13px; color: var(--fg3); margin: 4px 0 16px; }
.rep-error-btn {
  display: inline-flex; align-items: center; gap: 7px;
  background: var(--pure-white); border: 1px solid var(--border); border-radius: 10px;
  padding: 9px 15px; font: inherit; font-size: 13px; font-weight: 600; color: var(--fg1);
  cursor: pointer; transition: background var(--dur), transform 80ms;
}
.rep-error-btn:hover { background: var(--crema-100); }
.rep-error-btn:active { transform: scale(0.97); }
.rep-error-btn :deep(svg) { width: 15px; height: 15px; color: var(--fg2); }
</style>
