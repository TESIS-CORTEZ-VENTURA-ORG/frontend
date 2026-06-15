import { z } from 'zod'
import { backendFetch } from '../../utils/backend'
import type { UnitView } from './index.get'

interface Envelope<T> { success: boolean, data: T }

const createUnitSchema = z.object({
  code: z.string().min(1).max(16),
  name: z.string().min(1),
  family: z.enum(['mass', 'volume', 'count']),
  factorToBase: z.number().positive(),
})

// Crea una unidad de medida (HU-02-03). El backend exige owner/manager (CASL).
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, createUnitSchema.parse)
  const res = await backendFetch<Envelope<UnitView>>(event, '/api/units', {
    method: 'POST',
    body,
  })
  return ok(res.data)
})
