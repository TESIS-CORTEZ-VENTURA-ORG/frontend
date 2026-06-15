import { z } from 'zod'
import type { PurchaseOrder } from '#shared/types/domain'
import { backendFetch } from '../../utils/backend'

interface Envelope<T> { success: boolean, data: T }

// HU-05-04 · Crear OC (estado draft). Proveedor + ≥1 línea (insumo, cantidad > 0,
// costo ≥ 0). El total lo calcula el backend.
const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1),
  expectedAt: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(z.object({
      ingredientId: z.string().min(1),
      qtyOrdered: z.number().positive(),
      unitCost: z.number().nonnegative(),
    }))
    .min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, createPurchaseOrderSchema.parse)
  const res = await backendFetch<Envelope<PurchaseOrder>>(event, '/api/purchase-orders', {
    method: 'POST',
    body,
  })
  return ok(res.data)
})
