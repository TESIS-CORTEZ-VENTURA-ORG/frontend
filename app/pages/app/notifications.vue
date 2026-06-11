<script setup lang="ts">
import type { AppNotification, NotificationKind } from '#shared/types/domain'

definePageMeta({ layout: 'app' })
useSeoMeta({ title: 'Notificaciones — GastronomIA' })

const { data: notifications } = useNotifications()
const markRead = useMarkNotificationsRead()

const KIND_META: Record<NotificationKind, { icon: string, cls: string }> = {
  critical: { icon: 'i-lucide-alert-triangle', cls: 'critical' },
  warning: { icon: 'i-lucide-alert-circle', cls: 'warning' },
  info: { icon: 'i-lucide-lightbulb', cls: 'info' },
  success: { icon: 'i-lucide-check-circle-2', cls: 'success' },
}

const all = computed(() => notifications.value ?? [])
const unread = computed(() => all.value.filter(n => !n.read))
const read = computed(() => all.value.filter(n => n.read))

async function open(n: AppNotification): Promise<void> {
  if (!n.read) await markRead.mutateAsync(n.id)
  if (n.actionTo) await navigateTo(n.actionTo)
}

async function markAll(): Promise<void> {
  await markRead.mutateAsync(undefined)
}
</script>

<template>
  <div class="ntf-screen">
    <UiScreenHeader title="Notificaciones" :subtitle="unread.length ? `${unread.length} sin leer` : 'Todo al día'" back="/app">
      <template #trailing>
        <UButton
          v-if="unread.length"
          size="sm"
          color="neutral"
          variant="outline"
          icon="i-lucide-check-check"
          @click="markAll"
        >
          Marcar leídas
        </UButton>
      </template>
    </UiScreenHeader>

    <template v-if="all.length">
      <section v-if="unread.length" class="ntf-section">
        <div class="eyebrow ntf-eyebrow">Nuevas</div>
        <div class="ntf-list">
          <button
            v-for="n in unread"
            :key="n.id"
            class="ntf-row unread"
            :class="KIND_META[n.kind].cls"
            @click="open(n)"
          >
            <span class="ntf-ico" aria-hidden="true"><UIcon :name="KIND_META[n.kind].icon" /></span>
            <span class="ntf-body">
              <span class="ntf-title">{{ n.title }}</span>
              <span class="ntf-text">{{ n.body }}</span>
              <span v-if="n.actionLabel" class="ntf-action">{{ n.actionLabel }} <UIcon name="i-lucide-arrow-right" /></span>
            </span>
            <span class="ntf-right">
              <span class="ntf-time">{{ timeAgo(n.date) }}</span>
              <span class="ntf-dot" aria-label="Sin leer" />
            </span>
          </button>
        </div>
      </section>

      <section v-if="read.length" class="ntf-section">
        <div class="eyebrow ntf-eyebrow">Anteriores</div>
        <div class="ntf-list">
          <button
            v-for="n in read"
            :key="n.id"
            class="ntf-row"
            :class="KIND_META[n.kind].cls"
            @click="open(n)"
          >
            <span class="ntf-ico" aria-hidden="true"><UIcon :name="KIND_META[n.kind].icon" /></span>
            <span class="ntf-body">
              <span class="ntf-title">{{ n.title }}</span>
              <span class="ntf-text">{{ n.body }}</span>
            </span>
            <span class="ntf-right">
              <span class="ntf-time">{{ timeAgo(n.date) }}</span>
            </span>
          </button>
        </div>
      </section>
    </template>

    <UiEmptyState
      v-else
      icon="i-lucide-bell"
      title="Sin notificaciones"
      subtitle="Las alertas de margen, stock y recomendaciones IA aparecerán aquí."
    />
  </div>
</template>

<style scoped>
.ntf-screen {
  max-width: 640px;
  margin: 0 auto;
  padding-bottom: 24px;
}
.ntf-section { padding: 0 20px; margin-bottom: 18px; }
.ntf-eyebrow { padding: 4px 0 10px; }
.ntf-list {
  display: flex; flex-direction: column;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--pure-white);
  overflow: hidden;
}
.ntf-row {
  position: relative;
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px;
  border-bottom: 1px solid var(--border-subtle);
  background: transparent; border-left: none; border-right: none; border-top: none;
  font: inherit;
  cursor: pointer;
  text-align: left;
  transition: background var(--dur) var(--ease-standard);
}
.ntf-row:last-child { border-bottom: none; }
.ntf-row:hover { background: var(--crema-50); }
.ntf-row.unread { background: var(--crema-50); }
.ntf-row.unread:hover { background: var(--crema-100); }
.ntf-row::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px;
}
.ntf-row.critical::before { background: var(--danger); }
.ntf-row.warning::before { background: var(--mostaza); }
.ntf-row.info::before { background: var(--info); }
.ntf-row.success::before { background: var(--oliva); }
.ntf-ico {
  width: 36px; height: 36px; border-radius: 10px;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.ntf-ico .iconify { width: 17px; height: 17px; }
.ntf-row.critical .ntf-ico { background: var(--danger-bg); color: var(--danger); }
.ntf-row.warning .ntf-ico { background: var(--warning-bg); color: var(--mostaza-700); }
.ntf-row.info .ntf-ico { background: var(--info-bg); color: var(--info); }
.ntf-row.success .ntf-ico { background: var(--success-bg); color: var(--oliva-700); }
.ntf-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.ntf-title { font-size: 13.5px; font-weight: 600; color: var(--fg1); line-height: 1.3; }
.ntf-text { font-size: 12.5px; color: var(--fg2); line-height: 1.45; }
.ntf-action {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; font-weight: 600;
  color: var(--terracotta-700);
  margin-top: 4px;
}
.ntf-action .iconify { width: 12px; height: 12px; }
.ntf-right {
  display: flex; flex-direction: column; align-items: flex-end; gap: 6px;
  flex-shrink: 0;
}
.ntf-time { font-size: 10.5px; color: var(--fg3); white-space: nowrap; }
.ntf-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--terracotta);
}
</style>
