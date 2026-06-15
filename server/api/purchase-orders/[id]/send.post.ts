import type { PurchaseOrder } from '#shared/types/domain'
import { backendFetch } from '../../../utils/backend'

interface Envelope<T> { success: boolean, data: T }

// HU-05-05 (estado) · Enviar OC al proveedor (draft → sent). Proxy → backend.
// (El email/PDF al proveedor está diferido en el backend → solo transiciona estado.)
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Falta el id' })
  const res = await backendFetch<Envelope<PurchaseOrder>>(event, `/api/purchase-orders/${id}/send`, {
    method: 'POST',
  })
  return ok(res.data)
})
