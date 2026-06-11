import { z } from 'zod'

const recipeItemSchema = z.object({
  ingredientId: z.string(),
  name: z.string(),
  qty: z.number().positive(),
  unit: z.string(),
  cost: z.number().nonnegative(),
  wastePct: z.number().min(0).max(100).default(0),
})

const createRecipeSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(1),
  kind: z.enum(['dish', 'sub_recipe']).default('dish'),
  description: z.string().optional(),
  emoji: z.string().optional(),
  sellPrice: z.number().nonnegative(),
  items: z.array(recipeItemSchema).default([]),
  prepMinutes: z.number().int().positive().optional(),
  active: z.boolean().default(true),
})

export default defineEventHandler(async (event) => {
  const db = useMockDb()
  const body = await readValidatedBody(event, createRecipeSchema.parse)

  const cost = +body.items
    .reduce((sum, it) => sum + it.cost * (1 + it.wastePct / 100), 0)
    .toFixed(2)
  const marginPct = body.sellPrice > 0
    ? Math.round(((body.sellPrice - cost) / body.sellPrice) * 100)
    : 0

  const recipe = {
    ...body,
    id: nextId(db, 'rec'),
    cost,
    marginPct,
    soldToday: 0,
  }
  db.recipes.unshift(recipe)
  return ok(recipe)
})
