import { z } from 'zod'
import { backendFetch } from '../../utils/backend'
import { toFrontendIngredient } from '../../utils/e02-adapter'

interface Envelope<T> { success: boolean, data: T }
interface BeIngredient {
  id: string
  sku: string
  name: string
  type: string
  unit: string
  category: string | null
  unitCost: string
  updatedAt: string
}

const patchIngredientSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  unitCost: z.number().nonnegative().optional(),
  // stock/minStock pertenecen a Inventario (E05): se aceptan pero se ignoran hasta entonces.
  minStock: z.number().nonnegative().optional(),
  stock: z.number().nonnegative().optional(),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Falta el id' })
  }
  const body = await readValidatedBody(event, patchIngredientSchema.parse)
  const beBody: Record<string, unknown> = {}
  if (body.name !== undefined) beBody.name = body.name
  if (body.category !== undefined) beBody.category = body.category
  if (body.unit !== undefined) beBody.unit = body.unit
  if (body.unitCost !== undefined) beBody.unitCost = body.unitCost

  const res = await backendFetch<Envelope<BeIngredient>>(event, `/api/ingredients/${id}`, {
    method: 'PATCH',
    body: beBody,
  })
  return ok(toFrontendIngredient(res.data))
})
