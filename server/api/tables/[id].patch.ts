import { z } from 'zod'

const patchTableSchema = z.object({
  status: z.enum(['free', 'occupied', 'bill', 'reserved']).optional(),
  waiter: z.string().optional(),
  guests: z.number().int().positive().optional(),
})

export default defineEventHandler(async (event) => {
  const db = useMockDb()
  const id = getRouterParam(event, 'id')
  const table = db.tables.find(t => t.id === id)
  if (!table) {
    throw createError({ statusCode: 404, statusMessage: 'Mesa no encontrada' })
  }

  const body = await readValidatedBody(event, patchTableSchema.parse)
  Object.assign(table, body)

  if (body.status === 'free') {
    table.openedAt = undefined
    table.orderId = undefined
    table.guests = undefined
    table.waiter = undefined
  }

  return ok(table)
})
