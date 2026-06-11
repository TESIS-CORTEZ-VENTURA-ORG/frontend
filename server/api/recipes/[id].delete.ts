export default defineEventHandler((event) => {
  const db = useMockDb()
  const id = getRouterParam(event, 'id')
  const idx = db.recipes.findIndex(r => r.id === id)
  if (idx === -1) {
    throw createError({ statusCode: 404, statusMessage: 'Receta no encontrada' })
  }
  db.recipes.splice(idx, 1)
  return ok(null)
})
