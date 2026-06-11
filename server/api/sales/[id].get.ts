export default defineEventHandler((event) => {
  const db = useMockDb()
  const id = getRouterParam(event, 'id')
  const sale = db.sales.find(s => s.id === id)
  if (!sale) {
    throw createError({ statusCode: 404, statusMessage: 'Comprobante no encontrado' })
  }
  return ok(sale)
})
