export default defineEventHandler((event) => {
  const db = useMockDb()
  const { q, category, kind } = getQuery(event)

  let recipes = db.recipes
  if (typeof category === 'string' && category !== 'Todas') {
    recipes = recipes.filter(r => r.category === category)
  }
  if (typeof kind === 'string') {
    recipes = recipes.filter(r => r.kind === kind)
  }
  if (typeof q === 'string' && q.trim()) {
    const needle = q.trim().toLowerCase()
    recipes = recipes.filter(r => r.name.toLowerCase().includes(needle))
  }

  return ok(recipes, { totalCount: recipes.length, page: 1 })
})
