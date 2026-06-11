import { z } from 'zod'
import type { Order } from '#shared/types/domain'

const openTableSchema = z.object({
  guests: z.number().int().positive().default(2),
  waiter: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const db = useMockDb()
  const id = getRouterParam(event, 'id')
  const table = db.tables.find(t => t.id === id)
  if (!table) {
    throw createError({ statusCode: 404, statusMessage: 'Mesa no encontrada' })
  }
  if (table.status === 'occupied' || table.status === 'bill') {
    throw createError({ statusCode: 409, statusMessage: 'La mesa ya está ocupada' })
  }

  const body = await readValidatedBody(event, openTableSchema.parse)

  const order: Order = {
    id: nextId(db, 'ord'),
    tableId: table.id,
    openedAt: new Date().toISOString(),
    items: [],
    payments: [],
    status: 'open',
  }
  db.orders.push(order)

  table.status = 'occupied'
  table.openedAt = order.openedAt
  table.orderId = order.id
  table.guests = body.guests
  table.waiter = body.waiter ?? table.waiter

  return ok({ table, order })
})
