// HU-01-03 · Renovación de sesión: usa el refresh token sellado para pedir tokens
// nuevos al backend y re-sellar la cookie. El cliente puede llamarlo proactivamente
// (p. ej. al recuperar foco o ante un 401). Nunca expone tokens al JS del cliente.
export default defineEventHandler(async (event) => {
  const base = backendBase(event)
  await refreshSession(event, base) // re-sella la sesión; lanza 401 si el refresh murió
  const { user } = await getUserSession(event)
  return { success: true as const, data: { user } }
})
