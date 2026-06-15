import { z } from 'zod'
import { backendFetch } from '../../utils/backend'

interface Envelope<T> { success: boolean, data: T }
export interface ProductSupplierView {
  id: string
  supplierId: string
  supplierName: string
  supplierSku: string | null
  lastPrice: string | null
  preferred: boolean
}

const querySchema = z.object({ ingredientId: z.string().uuid() })

// Proxy → backend GET /api/ingredients/:ingredientId/suppliers (HU-02-06).
// El BFF aplana la ruta anidada del backend: `ingredientId` llega por query.
export default defineEventHandler(async (event) => {
  const { ingredientId } = await getValidatedQuery(event, querySchema.parse)
  const res = await backendFetch<Envelope<ProductSupplierView[]>>(
    event,
    `/api/ingredients/${ingredientId}/suppliers`,
  )
  return ok(res.data, { totalCount: res.data.length, page: 1 })
})
