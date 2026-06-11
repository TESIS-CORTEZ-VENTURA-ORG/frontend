import { z } from 'zod'
import type { Recipe } from '#shared/types/domain'

const patchRecipeSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  emoji: z.string().optional(),
  sellPrice: z.number().nonnegative().optional(),
  items: z.array(z.object({
    ingredientId: z.string(),
    name: z.string(),
    qty: z.number().positive(),
    unit: z.string(),
    cost: z.number().nonnegative(),
    wastePct: z.number().min(0).max(100),
  })).optional(),
  prepMinutes: z.number().int().positive().optional(),
  active: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const db = useMockDb()
  const id = getRouterParam(event, 'id')
  const recipe = db.recipes.find(r => r.id === id)
  if (!recipe) {
    throw createError({ statusCode: 404, statusMessage: 'Receta no encontrada' })
  }

  const body = await readValidatedBody(event, patchRecipeSchema.parse)
  Object.assign(recipe, body)

  const updated: Recipe = recipe
  updated.cost = +updated.items
    .reduce((sum, it) => sum + it.cost * (1 + it.wastePct / 100), 0)
    .toFixed(2)
  updated.marginPct = updated.sellPrice > 0
    ? Math.round(((updated.sellPrice - updated.cost) / updated.sellPrice) * 100)
    : 0

  return ok(updated)
})
