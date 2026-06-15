import { backendFetch } from '../../utils/backend'

interface Envelope<T> { success: boolean, data: T }

type Money = string

export type StockStatus = 'ok' | 'low' | 'critical'

// E07 · HU-07-05 · Una línea del reporte de inventario (valoración del stock actual).
export interface InventoryReportItemView {
  ingredientId: string
  name: string
  unit: string
  stock: string // .toFixed(3)
  minStock: string // .toFixed(3)
  unitCost: Money
  stockValue: Money
  status: StockStatus
}

export interface InventoryReportView {
  generatedAt: string
  totalSkus: number
  totalStockValue: Money
  lowStockCount: number
  criticalCount: number
  items: InventoryReportItemView[]
}

// Proxy autenticado → backend GET /api/reports/inventory. Lectura = owner/manager
// (read Report); staff → 403 (también para ?format=csv). HU-07-10: ?format=csv →
// el backend devuelve text/csv + Content-Disposition → se reenvía el cuerpo crudo.
export default defineEventHandler(async (event) => {
  const { format } = getQuery(event)
  if (format === 'csv') return proxyCsv(event, '/api/reports/inventory', { format })
  const res = await backendFetch<Envelope<InventoryReportView>>(event, '/api/reports/inventory')
  return ok(res.data)
})
