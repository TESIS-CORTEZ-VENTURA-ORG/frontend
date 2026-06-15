import { z } from 'zod'
import { backendFetch } from '../../utils/backend'
import type { CategoryView } from './index.get'

interface Envelope<T> { success: boolean, data: T }

const createCategorySchema = z.object({
  name: z.string().min(1),
  parentId: z.string().uuid().nullable().optional(),
})

// Crea una categoría de insumo (HU-02-04). `parentId` null/omitido = raíz.
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, createCategorySchema.parse)
  const res = await backendFetch<Envelope<CategoryView>>(event, '/api/categories', {
    method: 'POST',
    body,
  })
  return ok(res.data)
})
