import { backendBase, backendFetch } from '../../utils/backend'

interface Envelope<T> { success: boolean, data: T }

type Money = string

export interface SalesSeriesPointView { key: string, revenue: Money, count: number }

// E07 · HU-07-04 · Reporte de ventas en una ventana (?from=&to=) agrupado por
// day|method|docType. Moneda string. HU-07-10: ?format=csv → descarga text/csv.
export interface SalesReportView {
  from: string
  to: string
  totalRevenue: Money
  salesCount: number
  avgTicket: Money
  byMethod: { cash: Money, card: Money, yape: Money, plin: Money }
  byDocType: { boleta: Money, factura: Money }
  series: SalesSeriesPointView[]
}

// Proxy autenticado → backend GET /api/reports/sales. Reenvía from/to/groupBy/format.
// Lectura = owner/manager (read Report); staff → 403 (también para ?format=csv).
// Con ?format=csv el backend devuelve text/csv + Content-Disposition → se reenvía
// el cuerpo crudo con las mismas cabeceras (descarga). Sin format → envelope JSON.
export default defineEventHandler(async (event) => {
  const { from, to, groupBy, format } = getQuery(event)
  if (format === 'csv') return proxyCsv(event, '/api/reports/sales', { from, to, groupBy, format })
  const res = await backendFetch<Envelope<SalesReportView>>(event, '/api/reports/sales', {
    query: { from, to, groupBy },
  })
  return ok(res.data)
})
