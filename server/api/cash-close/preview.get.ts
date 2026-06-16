import type { CashClosePreview } from '#shared/types/domain'
import { backendFetch } from '../../utils/backend'

interface Envelope<T> { success: boolean, data: T }

// HU-04-08 · Preview del Cierre Z (ventana abierta del turno, no persiste). Proxy
// autenticado → backend GET /api/cash-close/preview (shape ya frontend-friendly).
export default defineEventHandler(async (event) => {
  const res = await backendFetch<Envelope<CashClosePreview>>(event, '/api/cash-close/preview')
  return ok(res.data)
})
