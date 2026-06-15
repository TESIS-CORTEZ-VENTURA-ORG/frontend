import { backendFetch } from '../../../utils/backend'

interface Envelope<T> { success: boolean, data: T }

type Money = string

// E07 · HU-07-03 · Dashboard del cajero (caja del día). Toda la moneda llega como
// string (PEN, precisión Decimal); el cliente la formatea con formatPEN.
export interface CashierDashboardView {
  date: string
  salesCount: number
  voidCount: number
  totalCollected: Money
  byMethod: { cash: Money, card: Money, yape: Money, plin: Money }
  avgTicket: Money
}

// Proxy autenticado → backend GET /api/reports/dashboard/cashier (ventana ?from=&to=
// opcional; default = hoy en Lima). Es operativo para cuadrar caja → el backend lo
// gatea con `read Sale` (staff lo ve, NO es 403). Thin passthrough.
export default defineEventHandler(async (event) => {
  const { from, to } = getQuery(event)
  const res = await backendFetch<Envelope<CashierDashboardView>>(event, '/api/reports/dashboard/cashier', {
    query: { from, to },
  })
  return ok(res.data)
})
