import { listStockLevels } from '../../utils/inventory-adapter'

// Proxy autenticado → backend GET /api/inventory/stock (E05, HU-05-01). Devuelve el
// stock actual de cada insumo con su estado de alerta (ok/low/critical). Dinero y
// cantidades llegan como string (precisión); el cliente los formatea.
export default defineEventHandler(async (event) => {
  const rows = await listStockLevels(event)
  return ok(rows, { totalCount: rows.length, page: 1 })
})
