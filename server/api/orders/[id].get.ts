export default defineEventHandler((event) => {
  const db = useMockDb()
  const id = getRouterParam(event, 'id')
  const order = db.orders.find(o => o.id === id)
  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'Orden no encontrada' })
  }
  return ok(order)
})
