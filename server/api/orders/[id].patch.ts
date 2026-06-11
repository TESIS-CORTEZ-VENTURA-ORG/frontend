import { z } from 'zod'

const patchOrderSchema = z.object({
  discount: z.object({
    type: z.enum(['pct', 'amount']),
    value: z.number().positive(),
    reason: z.string().optional(),
  }).nullable().optional(),
  itemUpdates: z.array(z.object({
    id: z.string(),
    qty: z.number().int().positive().optional(),
    status: z.enum(['pending', 'preparing', 'served']).optional(),
    unitPrice: z.number().nonnegative().optional(),
    remove: z.boolean().optional(),
  })).optional(),
  status: z.enum(['open', 'void']).optional(),
})

export default defineEventHandler(async (event) => {
  const db = useMockDb()
  const id = getRouterParam(event, 'id')
  const order = db.orders.find(o => o.id === id)
  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'Orden no encontrada' })
  }

  const body = await readValidatedBody(event, patchOrderSchema.parse)

  if (body.discount !== undefined) {
    order.discount = body.discount ?? undefined
  }
  if (body.status) {
    order.status = body.status
  }
  for (const upd of body.itemUpdates ?? []) {
    const idx = order.items.findIndex(it => it.id === upd.id)
    if (idx === -1) continue
    if (upd.remove) {
      order.items.splice(idx, 1)
      continue
    }
    const item = order.items[idx]
    if (item) {
      if (upd.qty !== undefined) item.qty = upd.qty
      if (upd.status !== undefined) item.status = upd.status
      if (upd.unitPrice !== undefined) item.unitPrice = upd.unitPrice
    }
  }

  if (body.status === 'void') {
    const table = db.tables.find(t => t.id === order.tableId)
    if (table) {
      table.status = 'free'
      table.openedAt = undefined
      table.orderId = undefined
      table.guests = undefined
      table.waiter = undefined
    }
  }

  return ok(order)
})
