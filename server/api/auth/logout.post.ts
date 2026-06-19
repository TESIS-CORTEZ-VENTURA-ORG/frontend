// HU-01-08 · Cierre de sesión: revoca el refresh token en el backend (server-side)
// y limpia la cookie sellada. La revocación es best-effort: si el backend no
// responde, igual se limpia la sesión local (no dejar al usuario "atrapado").
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const refreshToken = session.secure?.refreshToken

  if (refreshToken) {
    try {
      const base = backendBase(event)
      await $fetch(`${base}/api/auth/logout`, {
        method: 'POST',
        body: { refreshToken },
      })
    } catch {
      // best-effort: la cookie local se limpia igual abajo.
    }
  }

  await clearUserSession(event)
  return { success: true as const, data: null }
})
