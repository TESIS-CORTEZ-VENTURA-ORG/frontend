import { listWaste } from '../../utils/inventory-adapter'

// Proxy autenticado → backend GET /api/inventory/waste (E05, HU-05-09). Histórico
// de mermas (type='waste') + costo total perdido (Σ |qty|·unitCost). El BFF mapea
// los movimientos al `InventoryMovement` del frontend.
export default defineEventHandler(async (event) => {
  const waste = await listWaste(event)
  return ok(waste, { totalCount: waste.items.length, page: 1 })
})
