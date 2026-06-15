import { backendFetch } from '../../utils/backend'

interface Envelope<T> { success: boolean, data: T }

type Money = string

// E07 · HU-07-08 · Una línea del análisis Pareto/ABC de platos por revenue.
export interface ParetoDishView {
  name: string
  qty: number
  revenue: Money
  revenuePct: Money
  cumulativePct: Money
  abcClass: 'A' | 'B' | 'C'
}

export interface ParetoReportView {
  items: ParetoDishView[]
  totalRevenue: Money
}

// Proxy autenticado → backend GET /api/reports/pareto-dishes (ventana ?from=&to=
// opcional; default = hoy en Lima). Lectura = owner/manager (read Report); staff →
// 403. Thin passthrough (sin CSV: el backend no exporta Pareto).
export default defineEventHandler(async (event) => {
  const { from, to } = getQuery(event)
  const res = await backendFetch<Envelope<ParetoReportView>>(event, '/api/reports/pareto-dishes', {
    query: { from, to },
  })
  return ok(res.data)
})
