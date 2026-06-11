import { z } from 'zod'

const patchShoppingSchema = z.object({
  checked: z.boolean().optional(),
  suggestedQty: z.number().positive().optional(),
})

export default defineEventHandler(async (event) => {
  const db = useMockDb()
  const id = getRouterParam(event, 'id')
  const item = db.shoppingList.find(s => s.id === id)
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: 'Ítem no encontrado' })
  }

  const body = await readValidatedBody(event, patchShoppingSchema.parse)
  Object.assign(item, body)
  return ok(item)
})
