import { backendFetch } from '../../utils/backend'
import { toFrontendIngredient } from '../../utils/e02-adapter'

interface Envelope<T> { success: boolean, data: T }
interface BeIngredient {
  id: string
  sku: string
  name: string
  type: string
  unit: string
  category: string | null
  unitCost: string
  updatedAt: string
}

// Proxy autenticado → backend GET /api/ingredients. Mapea al shape del frontend
// (stock/mínimos quedan pendientes hasta Inventario/E05). Filtro `q` aquí.
export default defineEventHandler(async (event) => {
  const { q } = getQuery(event)
  const res = await backendFetch<Envelope<BeIngredient[]>>(event, '/api/ingredients')
  let ingredients = res.data.map(toFrontendIngredient)
  if (typeof q === 'string' && q.trim()) {
    const needle = q.trim().toLowerCase()
    ingredients = ingredients.filter(i => i.name.toLowerCase().includes(needle))
  }
  return ok(ingredients, { totalCount: ingredients.length, page: 1 })
})
