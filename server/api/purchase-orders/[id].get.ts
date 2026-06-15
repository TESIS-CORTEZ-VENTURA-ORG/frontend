import type { PurchaseOrder } from '#shared/types/domain'
import { backendFetch } from '../../utils/backend'

interface Envelope<T> { success: boolean, data: T }

// Proxy autenticado → backend GET /api/purchase-orders/:id (HU-05-04, detalle).
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Falta el id' })
  const res = await backendFetch<Envelope<PurchaseOrder>>(event, `/api/purchase-orders/${id}`)
  return ok(res.data)
})
