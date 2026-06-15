import { z } from 'zod'
import { backendFetch } from '../../utils/backend'
import type { CategoryView } from './index.get'

interface Envelope<T> { success: boolean, data: T }

const patchCategorySchema = z.object({
  name: z.string().min(1).optional(),
  parentId: z.string().uuid().nullable().optional(),
})

// Edita una categoría de insumo (HU-02-04). El backend bloquea ciclos (400).
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Falta el id' })
  const body = await readValidatedBody(event, patchCategorySchema.parse)
  const res = await backendFetch<Envelope<CategoryView>>(event, `/api/categories/${id}`, {
    method: 'PATCH',
    body,
  })
  return ok(res.data)
})
