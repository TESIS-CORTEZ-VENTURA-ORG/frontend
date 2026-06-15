<script setup lang="ts">
// E07 · Estado de carga de un reporte: skeletons (stat cards + bloque de detalle).
</script>

<template>
  <div class="rep-skel" aria-busy="true" aria-label="Cargando reporte">
    <div class="rep-skel-grid">
      <div class="rep-skel-card" />
      <div class="rep-skel-card" />
      <div class="rep-skel-card" />
    </div>
    <div class="rep-skel-block" />
  </div>
</template>

<style scoped>
.rep-skel { padding: 2px 0; }
.rep-skel-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 12px; }
@media (max-width: 520px) { .rep-skel-grid { grid-template-columns: 1fr 1fr; } }
.rep-skel-card { height: 92px; border-radius: 16px; }
.rep-skel-block { height: 220px; border-radius: 16px; }
.rep-skel-card, .rep-skel-block {
  background: linear-gradient(100deg, var(--crema-100) 30%, var(--crema-200) 50%, var(--crema-100) 70%);
  background-size: 200% 100%;
  animation: repShimmer 1.3s ease-in-out infinite;
}
@keyframes repShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) { .rep-skel-card, .rep-skel-block { animation: none; } }
</style>
