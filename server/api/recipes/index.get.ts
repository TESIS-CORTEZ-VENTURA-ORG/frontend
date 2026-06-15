import { listRecipes } from '../../utils/e02-adapter'

// Proxy autenticado → backend (Recipe + MenuItem). Filtros q/category/kind se
// aplican aquí porque el backend devuelve el catálogo completo del tenant.
export default defineEventHandler(async (event) => {
  const { q, category, kind } = getQuery(event)
  let recipes = await listRecipes(event)

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
