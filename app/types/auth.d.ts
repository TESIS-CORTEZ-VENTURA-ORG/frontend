import type { AppRole } from '#shared/types/api'

declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    email: string
    role: AppRole
    tenantId: string
  }

  interface UserSession {
    loggedInAt: number
  }
}

export {}
