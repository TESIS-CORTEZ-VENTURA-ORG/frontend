import { getOrder } from '../../utils/pos-adapter'

// Proxy autenticado → backend E03 (GET /api/orders/:id → OrderView). Mapea a Order.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const order = await getOrder(event, id)
  return ok(order)
})
