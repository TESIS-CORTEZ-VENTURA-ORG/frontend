<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const sections = useAppNavSections()
const route = useRoute()
const { user, clear } = useUserSession()
const { collapsed, toggle } = useSidebar()

const canManage = computed(
  () => user.value?.role === 'owner' || user.value?.role === 'manager',
)

// Secciones visibles según rol (oculta entradas de gestión a staff y secciones vacías).
const visibleSections = computed<AppNavSection[]>(() =>
  sections
    .map(s => ({ ...s, items: s.items.filter(i => !i.manageOnly || canManage.value) }))
    .filter(s => s.items.length > 0),
)

function isActive(item: AppNavItem): boolean {
  return item.exact ? route.path === item.to : route.path.startsWith(item.to)
}

async function logout(): Promise<void> {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/ingresar')
}

const initials = computed(() =>
  (user.value?.name ?? user.value?.email ?? '?')
    .split(/[\s@.]+/)
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase(),
)

const roleLabel = computed(() => {
  const map: Record<string, string> = { owner: 'Dueño', manager: 'Gerente', staff: 'Salón' }
  return map[user.value?.role ?? ''] ?? user.value?.role ?? ''
})

const accountItems = computed<DropdownMenuItem[][]>(() => [
  [{ label: user.value?.name ?? 'Mi cuenta', type: 'label' }],
  [
    { label: 'Perfil', icon: 'i-lucide-user', to: '/app/perfil' },
    { label: 'Ajustes del negocio', icon: 'i-lucide-settings', to: '/app/ajustes' },
    { label: 'Ayuda', icon: 'i-lucide-circle-help', to: '/app/ayuda' },
  ],
  [{ label: 'Cerrar sesión', icon: 'i-lucide-log-out', color: 'error', onSelect: () => { void logout() } }],
])
</script>

<template>
  <aside
    class="sidebar hidden lg:flex"
    :class="{ 'is-collapsed': collapsed }"
    aria-label="Navegación principal"
  >
    <!-- Brand + toggle colapsar (arriba) -->
    <div class="brand-bar" :class="{ 'is-collapsed': collapsed }">
      <NuxtLink v-if="!collapsed" to="/app" class="brand" aria-label="Ir al inicio">
        <img src="/img/gastronomia-logo.svg" alt="GastronomIA" class="brand-logo">
      </NuxtLink>
      <UTooltip
        :text="collapsed ? 'Expandir menú' : 'Colapsar menú'"
        :content="{ side: 'right', sideOffset: 8 }"
      >
        <button
          type="button"
          class="collapse-btn"
          :aria-label="collapsed ? 'Expandir menú' : 'Colapsar menú'"
          :aria-pressed="collapsed"
          @click="toggle"
        >
          <UIcon
            :name="collapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
            class="collapse-ico"
          />
        </button>
      </UTooltip>
    </div>

    <!-- Navegación (scrolleable) -->
    <nav class="nav-scroll">
      <div
        v-for="(section, i) in visibleSections"
        :key="section.title ?? `main-${i}`"
        class="nav-section"
      >
        <p v-if="section.title && !collapsed" class="nav-section-label">{{ section.title }}</p>
        <span v-else-if="section.title" class="nav-section-divider" aria-hidden="true" />

        <ul class="nav-list">
          <li v-for="item in section.items" :key="item.id">
            <UTooltip
              :text="item.label"
              :disabled="!collapsed"
              :content="{ side: 'right', sideOffset: 8 }"
            >
              <NuxtLink
                :to="item.to"
                class="nav-item"
                :class="{ 'is-active': isActive(item), 'is-brand': item.brand }"
                :aria-current="isActive(item) ? 'page' : undefined"
              >
                <UIcon :name="item.icon" class="nav-ico" />
                <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
              </NuxtLink>
            </UTooltip>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Pie: cuenta -->
    <div class="sidebar-foot">
      <UDropdownMenu
        :items="accountItems"
        :content="{ side: collapsed ? 'right' : 'top', align: collapsed ? 'end' : 'center', sideOffset: 8 }"
        :ui="{ content: 'w-[228px]' }"
      >
        <button type="button" class="account" :class="{ 'is-collapsed': collapsed }" aria-label="Menú de cuenta">
          <span class="avatar" aria-hidden="true">{{ initials }}</span>
          <span v-if="!collapsed" class="account-meta">
            <span class="account-name">{{ user?.name ?? user?.email }}</span>
            <span class="account-role">{{ roleLabel }}</span>
          </span>
          <UIcon v-if="!collapsed" name="i-lucide-chevrons-up-down" class="account-caret" />
        </button>
      </UDropdownMenu>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  inset-block: 0; left: 0;
  width: 256px;
  z-index: 40;
  flex-direction: column;
  /* Superficie elevada: blanco puro + borde definido + sombra hacia el contenido
     crema, para que el shell NO se funda con la vista. */
  background: var(--pure-white);
  border-right: 1px solid var(--border);
  box-shadow: 4px 0 24px rgba(26, 26, 26, 0.035);
  transition: width var(--dur) var(--ease-standard);
}
.sidebar.is-collapsed { width: 76px; }

/* ── Brand + toggle (header) ── */
.brand-bar {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  height: 60px;
  padding: 0 14px 0 20px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-subtle);
}
.brand-bar.is-collapsed { justify-content: center; padding: 0; }
.brand { display: flex; align-items: center; text-decoration: none; min-width: 0; }
.brand-logo { height: 20px; width: auto; display: block; }

/* ── Navegación (scrolleable) ── */
.nav-scroll {
  flex: 1;
  overflow-y: auto; overflow-x: hidden;
  padding: 14px 12px;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
.sidebar.is-collapsed .nav-scroll { padding: 14px 14px; }
.nav-section + .nav-section { margin-top: 18px; }
.nav-section-label {
  margin: 0;
  padding: 4px 12px 8px;
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.07em; text-transform: uppercase;
  color: var(--fg3);
}
/* En colapsado, las secciones se separan con un divisor en vez del label */
.nav-section-divider {
  display: block;
  height: 1px;
  margin: 0 6px 10px;
  background: var(--border-subtle);
}
.nav-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }

.nav-item {
  position: relative;
  display: flex; align-items: center; gap: 12px;
  padding: 9px 12px;
  border-radius: 9px;
  font-size: 14px; font-weight: 500;
  color: var(--fg2);
  text-decoration: none;
  transition:
    background var(--dur) var(--ease-standard),
    color var(--dur) var(--ease-standard);
}
.sidebar.is-collapsed .nav-item { justify-content: center; padding: 10px; }
.nav-item:hover { background: var(--crema-100); color: var(--fg1); }
.nav-item:focus-visible { outline: 2px solid var(--terracotta); outline-offset: 1px; }

/* Activo: fondo sutil + barra de acento */
.nav-item.is-active {
  background: var(--crema-200);
  color: var(--fg1);
  font-weight: 600;
}
.nav-item.is-active::before {
  content: '';
  position: absolute;
  left: -12px; top: 50%;
  transform: translateY(-50%);
  width: 3px; height: 20px;
  border-radius: 0 3px 3px 0;
  background: var(--terracotta);
}
.sidebar.is-collapsed .nav-item.is-active::before { left: -14px; }
.nav-item.is-active .nav-ico { color: var(--terracotta-700); }

.nav-ico { width: 19px; height: 19px; flex-shrink: 0; color: var(--fg3); }
.nav-item:hover .nav-ico { color: var(--fg2); }
.nav-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nav-item.is-brand .nav-ico { color: var(--terracotta); }

/* ── Toggle colapsar (en el header) ── */
.collapse-btn {
  width: 34px; height: 34px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 9px;
  background: transparent; border: none;
  color: var(--fg3); cursor: pointer;
  transition: background var(--dur) var(--ease-standard), color var(--dur) var(--ease-standard);
}
.collapse-btn:hover { background: var(--crema-100); color: var(--fg1); }
.collapse-btn:focus-visible { outline: 2px solid var(--terracotta); outline-offset: 1px; }
.collapse-ico { width: 18px; height: 18px; }

/* ── Pie: cuenta ── */
.sidebar-foot {
  flex-shrink: 0;
  padding: 12px;
  border-top: 1px solid var(--border-subtle);
}
.account {
  width: 100%;
  display: flex; align-items: center; gap: 10px;
  padding: 8px;
  border-radius: 10px;
  background: transparent; border: 1px solid transparent;
  cursor: pointer; text-align: left;
  transition: background var(--dur) var(--ease-standard), border-color var(--dur) var(--ease-standard);
}
.account.is-collapsed { justify-content: center; padding: 6px; }
.account:hover { background: var(--crema-100); border-color: var(--border-subtle); }
.account:focus-visible { outline: 2px solid var(--terracotta); outline-offset: 1px; }
.avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--terracotta); color: var(--crema-100);
  font-size: 12.5px; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.account-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.account-name {
  font-size: 13px; font-weight: 600; color: var(--fg1);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.account-role { font-size: 11px; color: var(--fg3); }
.account-caret { width: 16px; height: 16px; color: var(--fg3); flex-shrink: 0; }
</style>
