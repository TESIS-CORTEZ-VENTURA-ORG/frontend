import { backendFetch } from '../../../utils/backend'

interface Envelope<T> { success: boolean, data: T }

type Money = string

export interface TopDishWithContributionView {
  name: string
  qty: number
  revenue: Money
  contribution: Money
}

// E07 · HU-07-01 · Dashboard del admin (ejecutivo, KPIs financieros). Moneda string.
export interface AdminDashboardView {
  date: string
  revenueToday: Money
  revenue7d: Money
  ordersToday: number
  avgTicket: Money
  grossMarginPct: Money
  topDishes: TopDishWithContributionView[]
  lowStockCount: number
  salesByDay7d: { day: string, revenue: Money }[]
}

// Proxy autenticado → backend GET /api/reports/dashboard/admin (ventana ?from=&to=
// opcional; default = hoy en Lima). Info de gestión → `read Report` (owner/manager;
// staff → 403, lo gatea la pantalla). Thin passthrough.
export default defineEventHandler(async (event) => {
  const { from, to } = getQuery(event)
  const res = await backendFetch<Envelope<AdminDashboardView>>(event, '/api/reports/dashboard/admin', {
    query: { from, to },
  })
  return ok(res.data)
})
