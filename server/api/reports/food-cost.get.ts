import { backendFetch } from '../../utils/backend'

interface Envelope<T> { success: boolean, data: T }

type Money = string

// E07 · HU-07-06 · Una línea del reporte de food cost (food cost % por plato).
export interface FoodCostDishView {
  name: string
  sellPrice: Money
  ingredientCost: Money
  foodCostPct: Money
  unitsSold: number
  revenue: Money
}

export interface FoodCostReportView {
  period: string
  overallFoodCostPct: Money
  targetFoodCostPct: Money
  dishes: FoodCostDishView[]
}

// Proxy autenticado → backend GET /api/reports/food-cost?period=YYYY-MM (período
// obligatorio). Lectura = owner/manager (read Report); staff → 403 (también CSV).
// HU-07-10: ?format=csv → el backend devuelve text/csv → se reenvía el cuerpo crudo.
export default defineEventHandler(async (event) => {
  const { period, format } = getQuery(event)
  if (!period) throw createError({ statusCode: 400, statusMessage: 'Falta el período (YYYY-MM)' })
  if (format === 'csv') return proxyCsv(event, '/api/reports/food-cost', { period, format })
  const res = await backendFetch<Envelope<FoodCostReportView>>(event, '/api/reports/food-cost', {
    query: { period },
  })
  return ok(res.data)
})
