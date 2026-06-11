<script setup lang="ts">
// Sesión disponible desde el primer render (SSR) para el middleware global
const { fetch: fetchSession } = useUserSession()
await fetchSession()
</script>

<template>
  <UApp locale-code="es">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
