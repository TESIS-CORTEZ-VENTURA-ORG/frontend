import { backendFetch } from '../../../utils/backend'

interface Envelope<T> { success: boolean, data: T }

type Money = string

export interface TopDishView { name: string, qty: number, revenue: Money }

// E07 · HU-07-02 · Dashboard del gerente (operativo, foco en hoy). Moneda string.
export interface ManagerDashboardView {
  date: string
  salesToday: number
  revenueToday: Money
  openTables: number
  ordersOpen: number
  itemsInKitchen: number
  lowStockCount: number
  topDishesToday: TopDishView[]
}

// Proxy autenticado → backend GET /api/reports/dashboard/manager (ventana ?from=&to=
// opcional; default = hoy en Lima). Info de gestión → `read Report` (owner/manager;
// staff → 403, lo gatea la pantalla). Thin passthrough.
export default defineEventHandler(async (event) => {
  const { from, to } = getQuery(event)
  const res = await backendFetch<Envelope<ManagerDashboardView>>(event, '/api/reports/dashboard/manager', {
    query: { from, to },
  })
  return ok(res.data)
})
