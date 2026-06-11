export default defineEventHandler((event) => {
  const db = useMockDb()
  const id = getRouterParam(event, 'id')
  const table = db.tables.find(t => t.id === id)
  if (!table) {
    throw createError({ statusCode: 404, statusMessage: 'Mesa no encontrada' })
  }
  const order = table.orderId ? db.orders.find(o => o.id === table.orderId) ?? null : null
  return ok({ table, order })
})
