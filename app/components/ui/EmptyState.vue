<script setup lang="ts">
const props = defineProps<{
  icon?: string
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="empty">
    <span class="empty-ico" aria-hidden="true">
      <UIcon :name="props.icon ?? 'i-lucide-inbox'" />
    </span>
    <p class="empty-title">{{ props.title }}</p>
    <p v-if="props.subtitle" class="empty-sub">{{ props.subtitle }}</p>
    <div v-if="$slots.default" class="empty-action">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.empty {
  display: flex; flex-direction: column; align-items: center;
  text-align: center;
  padding: 48px 24px;
}
.empty-ico {
  width: 52px; height: 52px; border-radius: 14px;
  background: var(--crema-200); color: var(--fg3);
  display: inline-flex; align-items: center; justify-content: center;
  margin-bottom: 12px;
}
.empty-ico .iconify { width: 24px; height: 24px; }
.empty-title { font-size: 15px; font-weight: 600; color: var(--fg1); margin: 0; }
.empty-sub { font-size: 13px; color: var(--fg3); margin: 4px 0 0; max-width: 26em; }
.empty-action { margin-top: 16px; }
</style>
