import { z } from 'zod'
import { openTable } from '../../../utils/pos-adapter'

const openTableSchema = z.object({
  guests: z.number().int().positive().default(2),
  waiter: z.string().optional(),
})

// Proxy → backend E03: abrir mesa = POST /api/orders {tableId, guests}; luego
// devuelve {table, order} fresco. El mesero lo toma el backend del JWT.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const body = await readValidatedBody(event, openTableSchema.parse)
  const detail = await openTable(event, id, body)
  return ok(detail)
})
