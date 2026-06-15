import { z } from 'zod'
import type { PurchaseOrder } from '#shared/types/domain'
import { backendFetch } from '../../../utils/backend'

interface Envelope<T> { success: boolean, data: T }

// HU-05-06 · Recepcionar OC (parcial/total). Por cada línea: cantidad recibida > 0;
// el acumulado no puede exceder lo ordenado (el backend valida → 400). Crea
// movimientos `purchase` y sube el stock. Proxy → backend.
const receiveSchema = z.object({
  items: z
    .array(z.object({
      itemId: z.string().min(1),
      qtyReceived: z.number().positive(),
    }))
    .min(1),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Falta el id' })
  const body = await readValidatedBody(event, receiveSchema.parse)
  const res = await backendFetch<Envelope<PurchaseOrder>>(event, `/api/purchase-orders/${id}/receive`, {
    method: 'POST',
    body,
  })
  return ok(res.data)
})
