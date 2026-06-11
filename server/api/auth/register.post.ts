import { registerSchema } from '#shared/schemas/auth'
import type { AppRole } from '#shared/types/api'

// Registro MOCK del onboarding (frontend_context.md). Crea la sesión del
// nuevo dueño sobre el tenant demo; se reemplaza por la API NestJS
// (Better-Auth) en Sprint 1.
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, registerSchema.parse)

  const user = {
    id: 'u-nuevo',
    name: body.name,
    email: body.email,
    role: 'owner' as AppRole,
    tenantId: 'motif',
  }

  await setUserSession(event, { user, loggedInAt: Date.now() })

  return { success: true as const, data: { user } }
})
