import type { PurchaseOrder } from '#shared/types/domain'
import { backendFetch } from '../../utils/backend'

interface Envelope<T> { success: boolean, data: T }

// Proxy autenticado → backend GET /api/purchase-orders (E05 Inc2, HU-05-04). El
// backend ya devuelve un shape frontend-friendly (dinero string) → sin adapter.
export default defineEventHandler(async (event) => {
  const res = await backendFetch<Envelope<PurchaseOrder[]>>(event, '/api/purchase-orders')
  return ok(res.data, { totalCount: res.data.length, page: 1 })
})
