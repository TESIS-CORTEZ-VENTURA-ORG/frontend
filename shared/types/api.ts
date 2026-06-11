/** Sobre de respuesta compartido con la API (frontend_context.md §6). */
export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: { code: string, message: string }
  meta?: { totalCount: number, page: number }
}

export type AppRole = 'owner' | 'manager' | 'staff'
