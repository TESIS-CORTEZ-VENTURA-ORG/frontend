import type { ApiResponse } from '#shared/types/api'
import type { DiningTable, Order, OrderDiscount, OrderPayment, Sale } from '#shared/types/domain'

export function useTables() {
  return useQuery({
    key: ['tables'],
    query: () => $fetch<ApiResponse<DiningTable[]>>('/api/tables').then(r => r.data),
  })
}

export interface TableWithOrder {
  table: DiningTable
  order: Order | null
}

export function useTable(id: MaybeRefOrGetter<string>) {
  return useQuery({
    key: () => ['tables', toValue(id)] as const,
    query: () =>
      $fetch<ApiResponse<TableWithOrder>>(`/api/tables/${toValue(id)}`).then(r => r.data),
  })
}

function useInvalidateTables() {
  const cache = useQueryCache()
  return () => Promise.all([
    cache.invalidateQueries({ key: ['tables'] }),
    cache.invalidateQueries({ key: ['orders'] }),
  ])
}

export function useOpenTable() {
  const invalidate = useInvalidateTables()
  return useMutation({
    mutation: ({ id, guests, waiter }: { id: string, guests: number, waiter?: string }) =>
      $fetch<ApiResponse<TableWithOrder>>(`/api/tables/${id}/open`, {
        method: 'POST',
        body: { guests, waiter },
      }).then(r => r.data),
    onSettled: invalidate,
  })
}

export function usePatchTable() {
  const invalidate = useInvalidateTables()
  return useMutation({
    mutation: ({ id, ...payload }: { id: string, status?: DiningTable['status'], waiter?: string, guests?: number }) =>
      $fetch<ApiResponse<DiningTable>>(`/api/tables/${id}`, { method: 'PATCH', body: payload })
        .then(r => r.data),
    onSettled: invalidate,
  })
}

export function useAddOrderItems() {
  const invalidate = useInvalidateTables()
  return useMutation({
    mutation: ({ orderId, items }: { orderId: string, items: Array<{ recipeId: string, qty: number, notes?: string }> }) =>
      $fetch<ApiResponse<Order>>(`/api/orders/${orderId}/items`, {
        method: 'POST',
        body: { items },
      }).then(r => r.data),
    onSettled: invalidate,
  })
}

export interface OrderItemUpdate {
  id: string
  qty?: number
  status?: 'pending' | 'preparing' | 'served'
  unitPrice?: number
  remove?: boolean
}

export function usePatchOrder() {
  const invalidate = useInvalidateTables()
  return useMutation({
    mutation: ({ orderId, ...payload }: {
      orderId: string
      discount?: OrderDiscount | null
      itemUpdates?: OrderItemUpdate[]
      status?: 'open' | 'void'
      // HU-03-11: razón al anular (status:'void'). El BFF la mapea a /void {reason}.
      voidReason?: string
    }) =>
      $fetch<ApiResponse<Order>>(`/api/orders/${orderId}`, { method: 'PATCH', body: payload })
        .then(r => r.data),
    onSettled: invalidate,
  })
}

/** HU-03-06 · Enviar la comanda a cocina (rutea ítems a estaciones en el backend). */
export function useSendToKitchen() {
  const invalidate = useInvalidateTables()
  return useMutation({
    mutation: ({ orderId }: { orderId: string }) =>
      $fetch<ApiResponse<Order>>(`/api/orders/${orderId}/send-to-kitchen`, { method: 'POST' })
        .then(r => r.data),
    onSettled: invalidate,
  })
}

export function usePayOrder() {
  const cache = useQueryCache()
  return useMutation({
    mutation: ({ orderId, ...payload }: {
      orderId: string
      payments: OrderPayment[]
      docType?: 'boleta' | 'factura'
      customer?: string
      customerDoc?: string
    }) =>
      $fetch<ApiResponse<{ order: Order, sale: Sale }>>(`/api/orders/${orderId}/pay`, {
        method: 'POST',
        body: payload,
      }).then(r => r.data),
    onSettled: () => Promise.all([
      cache.invalidateQueries({ key: ['tables'] }),
      cache.invalidateQueries({ key: ['orders'] }),
      cache.invalidateQueries({ key: ['sales'] }),
    ]),
  })
}

/** Totales de una orden con descuento aplicado (IGV ya incluido en precios). */
export function orderTotals(order: Order | null | undefined): { gross: number, discount: number, total: number } {
  if (!order) return { gross: 0, discount: 0, total: 0 }
  const gross = order.items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0)
  const discount = order.discount
    ? order.discount.type === 'pct' ? gross * (order.discount.value / 100) : order.discount.value
    : 0
  return { gross, discount, total: +(gross - discount).toFixed(2) }
}
