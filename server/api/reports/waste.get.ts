import { backendFetch } from '../../utils/backend'

interface Envelope<T> { success: boolean, data: T }

type Money = string

export interface WasteByIngredientView { ingredientId: string, name: string, qty: string, cost: Money }
export interface WasteByReasonView { reason: string, qty: string, cost: Money }
export interface WasteMovementView {
  id: string
  ingredientId: string
  ingredientName: string
  qty: string // magnitud .toFixed(3)
  unit: string
  reason: string | null
  createdAt: string
}

// E07 · HU-07-07 · Reporte de mermas en una ventana (?from=&to=). Moneda string.
export interface WasteReportView {
  from: string
  to: string
  totalWasteQty: string
  totalWasteCost: Money
  byIngredient: WasteByIngredientView[]
  byReason: WasteByReasonView[]
  movements: WasteMovementView[]
}

// Proxy autenticado → backend GET /api/reports/waste. Reenvía from/to/format.
// Lectura = owner/manager (read Report); staff → 403 (también para ?format=csv).
// HU-07-10: ?format=csv → el backend devuelve text/csv → se reenvía el cuerpo crudo.
export default defineEventHandler(async (event) => {
  const { from, to, format } = getQuery(event)
  if (format === 'csv') return proxyCsv(event, '/api/reports/waste', { from, to, format })
  const res = await backendFetch<Envelope<WasteReportView>>(event, '/api/reports/waste', {
    query: { from, to },
  })
  return ok(res.data)
})
