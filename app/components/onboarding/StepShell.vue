<script setup lang="ts">
const props = defineProps<{
  step: number
  title: string
  subtitle?: string
  back?: string
}>()

const TOTAL = 5
</script>

<template>
  <div class="ob-screen">
    <header class="ob-hdr">
      <UButton
        v-if="props.back"
        :to="props.back"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        aria-label="Volver"
      />
      <div v-else class="ob-hdr-spacer" />
      <div class="ob-progress" role="progressbar" :aria-valuenow="props.step" :aria-valuemax="TOTAL" aria-label="Progreso del registro">
        <span
          v-for="i in TOTAL"
          :key="i"
          class="ob-dot"
          :class="{ done: i < props.step, current: i === props.step }"
        />
      </div>
      <div class="ob-step-count">{{ props.step }}/{{ TOTAL }}</div>
    </header>

    <div class="ob-body">
      <div class="ob-brand">
        <img src="/img/logo-symbol.svg" alt="" width="22" height="22">
        <span>Gastronom<em>IA</em></span>
      </div>
      <h1 class="ob-title">{{ props.title }}</h1>
      <p v-if="props.subtitle" class="ob-sub">{{ props.subtitle }}</p>

      <div class="ob-content">
        <slot />
      </div>
    </div>

    <footer v-if="$slots.cta" class="ob-cta">
      <slot name="cta" />
    </footer>
  </div>
</template>

<style scoped>
.ob-screen {
  min-height: 100dvh;
  display: flex; flex-direction: column;
  background: var(--crema);
}
.ob-hdr {
  display: flex; align-items: center; gap: 12px;
  padding: 8px;
  padding-top: calc(8px + env(safe-area-inset-top, 0px));
}
.ob-hdr-spacer { width: 40px; }
.ob-progress {
  flex: 1;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.ob-dot {
  width: 22px; height: 4px; border-radius: 999px;
  background: var(--crema-200);
  transition: background var(--dur) var(--ease-standard);
}
.ob-dot.done { background: var(--terracotta-300); }
.ob-dot.current { background: var(--terracotta); }
.ob-step-count {
  width: 40px;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 11px; color: var(--fg3);
}
.ob-body {
  flex: 1;
  width: 100%; max-width: 440px;
  margin: 0 auto;
  padding: 12px 24px 24px;
  display: flex; flex-direction: column;
}
.ob-brand {
  display: flex; align-items: center; gap: 8px;
  font-size: 12.5px; font-weight: 600; color: var(--fg2);
  margin-bottom: 14px;
}
.ob-brand em { font-style: normal; color: var(--terracotta); }
.ob-title {
  font-size: 26px; font-weight: 600;
  letter-spacing: -0.02em; line-height: 1.15;
  color: var(--fg1);
  margin: 0;
  text-wrap: balance;
}
.ob-sub { font-size: 13.5px; color: var(--fg2); margin: 6px 0 0; line-height: 1.5; }
.ob-content { margin-top: 22px; flex: 1; }
.ob-cta {
  width: 100%; max-width: 440px;
  margin: 0 auto;
  padding: 12px 24px calc(16px + env(safe-area-inset-bottom, 0px));
}
</style>
