import { z } from 'zod'
import { backendFetch } from '../../utils/backend'

interface Envelope<T> { success: boolean, data: T }

const querySchema = z.object({
  ingredientId: z.string().uuid(),
  supplierId: z.string().uuid(),
})

// Desasocia un insumo de un proveedor (HU-02-06) →
// backend DELETE /api/ingredients/:ingredientId/suppliers/:supplierId.
export default defineEventHandler(async (event) => {
  const { ingredientId, supplierId } = await getValidatedQuery(event, querySchema.parse)
  await backendFetch<Envelope<{ unlinked: true }>>(
    event,
    `/api/ingredients/${ingredientId}/suppliers/${supplierId}`,
    { method: 'DELETE' },
  )
  return ok(null)
})
