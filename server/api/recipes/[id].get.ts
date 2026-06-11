export default defineEventHandler((event) => {
  const db = useMockDb()
  const id = getRouterParam(event, 'id')
  const recipe = db.recipes.find(r => r.id === id)
  if (!recipe) {
    throw createError({ statusCode: 404, statusMessage: 'Receta no encontrada' })
  }
  return ok(recipe)
})
