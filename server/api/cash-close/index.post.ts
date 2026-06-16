import type { CashClose } from '#shared/types/domain'
import { backendFetch } from '../../utils/backend'

interface Envelope<T> { success: boolean, data: T }

// HU-04-08 · Ejecuta el Cierre Z: persiste el agregado del turno (inmutable). El
// backend exige rol manager/owner (403 a staff) y no recibe cuerpo. Proxy autenticado.
export default defineEventHandler(async (event) => {
  const res = await backendFetch<Envelope<CashClose>>(event, '/api/cash-close', { method: 'POST' })
  return ok(res.data)
})
