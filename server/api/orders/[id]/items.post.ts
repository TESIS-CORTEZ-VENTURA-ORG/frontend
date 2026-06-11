import { z } from 'zod'

const addItemsSchema = z.object({
  items: z.array(z.object({
    recipeId: z.string(),
    qty: z.number().int().positive(),
    notes: z.string().optional(),
  })).min(1),
})

export default defineEventHandler(async (event) => {
  const db = useMockDb()
  const id = getRouterParam(event, 'id')
  const order = db.orders.find(o => o.id === id)
  if (!order || order.status !== 'open') {
    throw createError({ statusCode: 404, statusMessage: 'Orden no encontrada o cerrada' })
  }

  const body = await readValidatedBody(event, addItemsSchema.parse)

  for (const line of body.items) {
    const recipe = db.recipes.find(r => r.id === line.recipeId)
    if (!recipe) {
      throw createError({ statusCode: 422, statusMessage: `Receta ${line.recipeId} no existe` })
    }
    order.items.push({
      id: nextId(db, 'oi'),
      recipeId: recipe.id,
      name: recipe.name,
      qty: line.qty,
      unitPrice: recipe.sellPrice,
      notes: line.notes,
      status: 'pending',
    })
    recipe.soldToday += line.qty
  }

  return ok(order)
})
