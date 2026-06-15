import { z } from 'zod'
import type { Sale } from '#shared/types/domain'

// NOTA: este handler sigue sobre el MOCK a propósito. El cobro y la emisión de
// comprobantes son E04 (billing), que el backend aún no expone. Cuando exista,
// se reemplaza por un proxy `backendFetch` (vía pos-adapter), igual que tables/orders.

const paySchema = z.object({
  payments: z.array(z.object({
    method: z.enum(['cash', 'card', 'yape', 'plin']),
    amount: z.number().positive(),
  })).min(1),
  docType: z.enum(['boleta', 'factura']).default('boleta'),
  customer: z.string().optional(),
  customerDoc: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const db = useMockDb()
  const id = getRouterParam(event, 'id')
  const order = db.orders.find(o => o.id === id)
  if (!order || order.status !== 'open') {
    throw createError({ statusCode: 404, statusMessage: 'Orden no encontrada o ya cerrada' })
  }

  const body = await readValidatedBody(event, paySchema.parse)

  const gross = order.items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0)
  const discount = order.discount
    ? order.discount.type === 'pct' ? gross * (order.discount.value / 100) : order.discount.value
    : 0
  const total = +(gross - discount).toFixed(2)
  const subtotal = +(total / (1 + db.settings.tax.igvPct / 100)).toFixed(2)

  order.payments = body.payments
  order.status = 'paid'

  const table = db.tables.find(t => t.id === order.tableId)
  const serie = body.docType === 'boleta' ? db.settings.tax.boletaSerie : db.settings.tax.facturaSerie
  const lastNumber = db.sales
    .filter(s => s.docType === body.docType)
    .reduce((max, s) => Math.max(max, s.number), 1000)

  const sale: Sale = {
    id: nextId(db, 'sale'),
    serie,
    number: lastNumber + 1,
    docType: body.docType,
    date: new Date().toISOString(),
    tableLabel: table ? `Mesa ${table.number}` : undefined,
    customer: body.customer,
    customerDoc: body.customerDoc,
    items: order.items.map(it => ({
      name: it.name,
      qty: it.qty,
      unitPrice: it.unitPrice,
      total: +(it.qty * it.unitPrice).toFixed(2),
    })),
    subtotal,
    igv: +(total - subtotal).toFixed(2),
    total,
    method: body.payments[0]?.method ?? 'cash',
    status: 'issued',
  }
  db.sales.unshift(sale)

  if (table) {
    table.status = 'free'
    table.openedAt = undefined
    table.orderId = undefined
    table.guests = undefined
    table.waiter = undefined
  }

  return ok({ order, sale })
})
