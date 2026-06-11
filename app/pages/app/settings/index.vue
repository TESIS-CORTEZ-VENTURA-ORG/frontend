<script setup lang="ts">
definePageMeta({ layout: 'app' })
useSeoMeta({ title: 'Ajustes del negocio — GastronomIA' })

const { data: settings } = useAppSettings()

interface SettingsEntry {
  icon: string
  label: string
  sub: string
  to: string
}

const entries: SettingsEntry[] = [
  { icon: 'i-lucide-store', label: 'Datos del local', sub: 'Nombre, RUC, dirección y contacto', to: '/app/settings/business' },
  { icon: 'i-lucide-clock', label: 'Horarios', sub: 'Atención al cliente por día', to: '/app/settings/hours' },
  { icon: 'i-lucide-book-open', label: 'Carta', sub: 'Precios, disponibilidad y promociones', to: '/app/settings/menu' },
  { icon: 'i-lucide-credit-card', label: 'Métodos de pago', sub: 'Efectivo, tarjeta, Yape y Plin', to: '/app/settings/payments' },
  { icon: 'i-lucide-layout-grid', label: 'Mesas y áreas', sub: 'Zonas del salón y número de mesas', to: '/app/settings/tables' },
  { icon: 'i-lucide-percent', label: 'Impuestos y comprobantes', sub: 'IGV y series de boleta y factura', to: '/app/settings/tax' },
]

const initials = computed(() =>
  (settings.value?.business.name ?? '')
    .split(' ')
    .filter(part => part.length > 2)
    .map(part => part[0])
    .slice(0, 2)
    .join(''),
)
</script>

<template>
  <div class="settings-page">
    <UiScreenHeader title="Ajustes del negocio" subtitle="Configuración" back="/app/menu" />

    <div class="biz-card">
      <span class="biz-mark" aria-hidden="true">{{ initials || '—' }}</span>
      <div class="biz-meta">
        <span class="biz-name">{{ settings?.business.name ?? 'Cargando…' }}</span>
        <span v-if="settings" class="biz-sub">RUC {{ settings.business.ruc }} · {{ settings.business.district }}</span>
      </div>
    </div>

    <div class="section-eyebrow">Secciones</div>
    <div class="settings-list">
      <NuxtLink
        v-for="entry in entries"
        :key="entry.to"
        :to="entry.to"
        class="settings-item"
      >
        <span class="settings-ico" aria-hidden="true"><UIcon :name="entry.icon" /></span>
        <span class="settings-text">
          <span class="settings-label">{{ entry.label }}</span>
          <span class="settings-sub">{{ entry.sub }}</span>
        </span>
        <UIcon name="i-lucide-chevron-right" class="settings-chevron" aria-hidden="true" />
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  max-width: 560px;
  margin: 0 auto;
  padding-bottom: 24px;
}

.biz-card {
  display: flex; align-items: center; gap: 14px;
  background: var(--pure-white);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 16px;
  margin: 4px 20px 20px;
}
.biz-mark {
  width: 56px; height: 56px; border-radius: 14px;
  background: var(--espresso);
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 22px; font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--crema-100);
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.biz-meta { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.biz-name {
  font-size: 16px; font-weight: 600;
  letter-spacing: -0.01em; color: var(--fg1);
  line-height: 1.25;
}
.biz-sub {
  font-size: 12px; color: var(--fg3);
  font-variant-numeric: tabular-nums;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.section-eyebrow {
  font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--fg3);
  padding: 4px 24px 10px;
}
.settings-list {
  background: var(--pure-white);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  overflow: hidden;
  margin: 0 20px;
}
.settings-item {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 14px;
  text-decoration: none;
  transition: background var(--dur) var(--ease-standard);
}
.settings-item + .settings-item { border-top: 1px solid var(--border-subtle); }
.settings-item:hover { background: var(--crema-100); }
.settings-ico {
  width: 36px; height: 36px; border-radius: 10px;
  background: var(--crema-200); color: var(--terracotta-700);
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.settings-ico .iconify { width: 18px; height: 18px; }
.settings-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.settings-label { font-size: 14px; font-weight: 600; color: var(--fg1); }
.settings-sub { font-size: 12px; color: var(--fg3); }
.settings-chevron { width: 16px; height: 16px; color: var(--fg3); flex-shrink: 0; }
</style>
