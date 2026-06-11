import { z } from 'zod'

const createMovementSchema = z.object({
  ingredientId: z.string(),
  type: z.enum(['purchase', 'sale', 'waste', 'adjustment', 'count']),
  qty: z.number(),
  note: z.string().optional(),
  user: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const db = useMockDb()
  const body = await readValidatedBody(event, createMovementSchema.parse)

  const ingredient = db.ingredients.find(i => i.id === body.ingredientId)
  if (!ingredient) {
    throw createError({ statusCode: 422, statusMessage: 'Insumo no existe' })
  }

  ingredient.stock = +(ingredient.stock + body.qty).toFixed(2)
  ingredient.updatedAt = new Date().toISOString()

  const movement = {
    id: nextId(db, 'mov'),
    ingredientId: ingredient.id,
    ingredientName: ingredient.name,
    type: body.type,
    qty: body.qty,
    unit: ingredient.unit,
    date: ingredient.updatedAt,
    note: body.note,
    user: body.user,
  }
  db.movements.unshift(movement)

  return ok({ movement, ingredient })
})
