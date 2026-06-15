import { z } from 'zod'
import { backendFetch } from '../../utils/backend'

interface Envelope<T> { success: boolean, data: T }
export interface ConvertResult {
  from: string
  to: string
  qty: number
  result: number
}

const convertSchema = z.object({
  qty: z.coerce.number().positive(),
  from: z.string().min(1),
  to: z.string().min(1),
})

// Conversión entre unidades de la misma familia (HU-02-03). 400 si difieren.
export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, convertSchema.parse)
  const res = await backendFetch<Envelope<ConvertResult>>(event, '/api/units/convert', { query })
  return ok(res.data)
})
