<script setup lang="ts">
const props = defineProps<{
  title: string
  subtitle?: string
  back?: string
}>()

const router = useRouter()

function goBack(): void {
  // Prioriza el historial real: vuelve a DONDE vino el usuario, no a un padre
  // fijo. Sin esto, entrar a una subpágina desde otra ruta (p. ej. Mesas →
  // "Configurar mesas" → Ajustes › Mesas) hacía que "atrás" saltara al padre
  // hardcodeado en lugar de regresar a Mesas.
  // El prop `back` queda como destino de respaldo solo cuando NO hay historial
  // dentro de la app (carga directa / deep-link / recarga).
  const hasInAppHistory = Boolean(router.options.history.state?.back)
  if (hasInAppHistory) {
    router.back()
  }
  else {
    void navigateTo(props.back ?? '/app')
  }
}
</script>

<template>
  <header class="screen-hdr">
    <button class="icon-btn" aria-label="Volver" @click="goBack">
      <UIcon name="i-lucide-arrow-left" />
    </button>
    <div class="hdr-body">
      <h1 class="hdr-title">{{ props.title }}</h1>
      <p v-if="props.subtitle || $slots.subtitle" class="hdr-sub">
        <slot name="subtitle">{{ props.subtitle }}</slot>
      </p>
    </div>
    <div v-if="$slots.trailing" class="hdr-trailing">
      <slot name="trailing" />
    </div>
  </header>
</template>

<style scoped>
.screen-hdr {
  display: flex; align-items: center; gap: 12px;
  padding: calc(12px + env(safe-area-inset-top, 0px)) 20px 14px;
}
@media (min-width: 1024px) {
  .screen-hdr { padding-top: 28px; }
}
/* El botón "atrás" usa el .icon-btn global (components.css) */
.hdr-body { flex: 1; min-width: 0; }
.hdr-title {
  font-size: 22px; font-weight: 600;
  letter-spacing: -0.02em; line-height: 1.15;
  color: var(--fg1); margin: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.hdr-sub { font-size: 12.5px; color: var(--fg3); margin: 3px 0 0; }
.hdr-trailing { flex-shrink: 0; display: flex; gap: 8px; }
</style>
