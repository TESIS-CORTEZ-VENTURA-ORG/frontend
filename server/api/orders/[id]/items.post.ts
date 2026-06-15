import { z } from 'zod'
import { addOrderItems } from '../../../utils/pos-adapter'

const addItemsSchema = z.object({
  items: z.array(z.object({
    recipeId: z.string(),
    qty: z.number().int().positive(),
    notes: z.string().optional(),
  })).min(1),
})

// Proxy → backend E03: resuelve recipeId → menuItemId y POST /api/orders/:id/items.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const body = await readValidatedBody(event, addItemsSchema.parse)
  const order = await addOrderItems(event, id, body.items)
  return ok(order)
})
