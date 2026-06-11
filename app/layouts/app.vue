<template>
  <div class="min-h-dvh">
    <NavDesktopSidebar />
    <main class="app-main lg:ml-64">
      <slot />
    </main>
    <NavMobileTabBar />
  </div>
</template>

<style scoped>
.app-main {
  /* aire para el tab bar móvil + safe area iPhone */
  padding-bottom: calc(84px + env(safe-area-inset-bottom, 0px));
}
@media (min-width: 1024px) {
  .app-main { padding-bottom: 32px; }
}
</style>
