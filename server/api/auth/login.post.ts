import { loginSchema } from '#shared/schemas/auth'
import type { AppRole } from '#shared/types/api'

interface DemoUser {
  id: string
  name: string
  email: string
  role: AppRole
  tenantId: string
}

// Personas del caso de estudio Motif (frontend_context.md §1).
// La contraseña vive en NUXT_DEMO_PASSWORD; este mock se reemplaza por la
// API NestJS (Better-Auth) en Sprint 1.
const DEMO_USERS: DemoUser[] = [
  { id: 'u-maria', name: 'María Quispe', email: 'maria@motif.pe', role: 'owner', tenantId: 'motif' },
  { id: 'u-carlos', name: 'Carlos Salazar', email: 'carlos@motif.pe', role: 'manager', tenantId: 'motif' },
  { id: 'u-lucia', name: 'Lucía Mendoza', email: 'staff@motif.pe', role: 'staff', tenantId: 'motif' },
]

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parse)
  const { demoPassword } = useRuntimeConfig(event)

  const user = DEMO_USERS.find(u => u.email === body.email)
  if (!user || !demoPassword || body.password !== demoPassword) {
    throw createError({ statusCode: 401, statusMessage: 'Credenciales inválidas' })
  }

  await setUserSession(event, { user, loggedInAt: Date.now() })

  return { success: true as const, data: { user } }
})
