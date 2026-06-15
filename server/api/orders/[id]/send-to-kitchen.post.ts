import { sendOrderToKitchen } from '../../../utils/pos-adapter'

// HU-03-06 · Proxy → backend E03: POST /api/orders/:id/send-to-kitchen (sin body).
// El backend marca la orden como sent_to_kitchen y enruta los ítems a sus estaciones.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const order = await sendOrderToKitchen(event, id)
  return ok(order)
})
