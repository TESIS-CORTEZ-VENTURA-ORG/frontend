<script setup lang="ts">
const items = useAppNav()
const route = useRoute()

function isActive(item: AppNavItem): boolean {
  return item.exact ? route.path === item.to : route.path.startsWith(item.to)
}
</script>

<template>
  <nav class="tab-bar" aria-label="Navegación principal">
    <NuxtLink
      v-for="item in items"
      :key="item.id"
      :to="item.to"
      class="tab"
      :class="{ 'is-active': isActive(item), 'is-brand': item.brand }"
      :aria-current="isActive(item) ? 'page' : undefined"
    >
      <img
        v-if="item.brand"
        src="/img/logo-symbol.svg"
        alt=""
        class="tab-brand-ico"
        width="24"
        height="24"
      >
      <UIcon v-else :name="item.icon" class="tab-ico" />
      <span class="tab-label">{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>

<style scoped>
.tab-bar {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  z-index: 40;
  background: rgba(248, 244, 237, 0.85);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-top: 1px solid var(--border-subtle);
  padding: 8px 8px calc(8px + env(safe-area-inset-bottom, 0px));
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
}
@media (min-width: 1024px) {
  .tab-bar { display: none; }
}
.tab {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 3px;
  min-height: 52px;
  padding: 6px 4px;
  color: var(--fg3);
  border-radius: 10px;
  transition: color var(--dur) var(--ease-standard);
  position: relative;
  text-decoration: none;
}
.tab-ico { width: 22px; height: 22px; }
.tab-label { font-size: 10.5px; font-weight: 500; letter-spacing: -0.01em; }
.tab.is-active { color: var(--terracotta-700); }
.tab.is-active .tab-label { font-weight: 600; }
.tab.is-active::before {
  content: ''; position: absolute; top: 0; left: 50%;
  transform: translateX(-50%);
  width: 28px; height: 3px; border-radius: 0 0 3px 3px;
  background: var(--terracotta);
}
.tab-brand-ico {
  width: 24px; height: 24px;
  transition: transform var(--dur) var(--ease-standard), filter var(--dur) var(--ease-standard);
}
.tab.is-brand:not(.is-active) .tab-brand-ico { filter: grayscale(1) opacity(0.55); }
.tab.is-brand.is-active .tab-brand-ico { transform: scale(1.05); }
</style>
