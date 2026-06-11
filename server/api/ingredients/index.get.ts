export default defineEventHandler((event) => {
  const db = useMockDb()
  const { q } = getQuery(event)

  let ingredients = db.ingredients
  if (typeof q === 'string' && q.trim()) {
    const needle = q.trim().toLowerCase()
    ingredients = ingredients.filter(i => i.name.toLowerCase().includes(needle))
  }

  return ok(ingredients, { totalCount: ingredients.length, page: 1 })
})
