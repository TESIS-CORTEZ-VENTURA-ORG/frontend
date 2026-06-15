import { z } from 'zod'
import { backendFetch } from '../../utils/backend'
import type { UnitView } from './index.get'

interface Envelope<T> { success: boolean, data: T }

const patchUnitSchema = z.object({
  code: z.string().min(1).max(16).optional(),
  name: z.string().min(1).optional(),
  family: z.enum(['mass', 'volume', 'count']).optional(),
  factorToBase: z.number().positive().optional(),
})

// Edita una unidad de medida (HU-02-03).
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Falta el id' })
  const body = await readValidatedBody(event, patchUnitSchema.parse)
  const res = await backendFetch<Envelope<UnitView>>(event, `/api/units/${id}`, {
    method: 'PATCH',
    body,
  })
  return ok(res.data)
})
