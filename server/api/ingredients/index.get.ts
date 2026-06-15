import { backendFetch } from '../../utils/backend'
import { toFrontendIngredient } from '../../utils/e02-adapter'
import { stockMap } from '../../utils/inventory-adapter'

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

// Proxy autenticado → backend GET /api/ingredients (catálogo, E02). Fusiona el
// **stock real** desde GET /api/inventory/stock (E05): stock/minStock/status. Si
// el insumo no aparece en el inventario, quedan en 0/ok. Filtro `q` aquí.
export default defineEventHandler(async (event) => {
  const { q } = getQuery(event)
  const [res, stock] = await Promise.all([
    backendFetch<Envelope<BeIngredient[]>>(event, '/api/ingredients'),
    stockMap(event),
  ])
  let ingredients = res.data.map((b) => {
    const ing = toFrontendIngredient(b)
    const sv = stock.get(b.id)
    if (sv) {
      ing.stock = Number(sv.stock)
      ing.minStock = Number(sv.minStock)
      ing.status = sv.status
    }
    return ing
  })
  if (typeof q === 'string' && q.trim()) {
    const needle = q.trim().toLowerCase()
    ingredients = ingredients.filter(i => i.name.toLowerCase().includes(needle))
  }
  return ok(ingredients, { totalCount: ingredients.length, page: 1 })
})
