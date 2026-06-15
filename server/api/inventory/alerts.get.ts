import { listAlerts } from '../../utils/inventory-adapter'

// Proxy autenticado → backend GET /api/inventory/alerts (E05, HU-05-10). Insumos
// bajo el mínimo de reorden, más críticos primero (mayor déficit). El frontend los
// usa para sembrar la Lista de Compras (ver server/api/inventory/shopping-list.get).
export default defineEventHandler(async (event) => {
  const alerts = await listAlerts(event)
  return ok(alerts, { totalCount: alerts.length, page: 1 })
})
