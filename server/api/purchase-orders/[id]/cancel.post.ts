import type { PurchaseOrder } from '#shared/types/domain'
import { backendFetch } from '../../../utils/backend'

interface Envelope<T> { success: boolean, data: T }

// HU-05-07 · Cancelar OC ({draft, sent} → cancelled). Proxy → backend (409 si ya
// recibió algo). El mensaje del backend se propaga como toast.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Falta el id' })
  const res = await backendFetch<Envelope<PurchaseOrder>>(event, `/api/purchase-orders/${id}/cancel`, {
    method: 'POST',
  })
  return ok(res.data)
})
