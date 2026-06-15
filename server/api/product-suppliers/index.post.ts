import { z } from 'zod'
import { backendFetch } from '../../utils/backend'
import type { ProductSupplierView } from './index.get'

interface Envelope<T> { success: boolean, data: T }

const linkSchema = z.object({
  ingredientId: z.string().uuid(),
  supplierId: z.string().uuid(),
  supplierSku: z.string().min(1).optional(),
  lastPrice: z.number().nonnegative().optional(),
  preferred: z.boolean().optional(),
})

// Asocia un insumo ↔ proveedor (HU-02-06). 409 si ya está asociado.
export default defineEventHandler(async (event) => {
  const { ingredientId, ...body } = await readValidatedBody(event, linkSchema.parse)
  const res = await backendFetch<Envelope<ProductSupplierView>>(
    event,
    `/api/ingredients/${ingredientId}/suppliers`,
    { method: 'POST', body },
  )
  return ok(res.data)
})
