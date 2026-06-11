<script setup lang="ts">
const props = defineProps<{
  title: string
  subtitle?: string
  back?: string
}>()

const router = useRouter()

function goBack(): void {
  if (props.back) {
    void navigateTo(props.back)
  }
  else {
    router.back()
  }
}
</script>

<template>
  <header class="screen-hdr">
    <button class="hdr-back" aria-label="Volver" @click="goBack">
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
.hdr-back {
  width: 40px; height: 40px; border-radius: 12px;
  background: var(--pure-white);
  border: 1px solid var(--border-subtle);
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: var(--fg2);
  flex-shrink: 0;
  transition: background var(--dur) var(--ease-standard), color var(--dur) var(--ease-standard);
}
.hdr-back:hover { background: var(--crema-200); color: var(--fg1); }
.hdr-back .iconify { width: 18px; height: 18px; }
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
