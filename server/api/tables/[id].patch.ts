import { z } from 'zod'
import { patchTable } from '../../utils/pos-adapter'

const patchTableSchema = z.object({
  status: z.enum(['free', 'occupied', 'bill', 'reserved']).optional(),
  waiter: z.string().optional(),
  guests: z.number().int().positive().optional(),
})

// Proxy → backend E03: PATCH /api/tables/:id {status}. Caso real: pedir cuenta
// (status:'bill') o liberar mesa ('free'). waiter/guests no tienen campo backend.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const body = await readValidatedBody(event, patchTableSchema.parse)
  const table = await patchTable(event, id, body)
  return ok(table)
})
