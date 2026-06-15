import type { ApiResponse } from '#shared/types/api'
import type { PurchaseOrder } from '#shared/types/domain'

// Órdenes de Compra (E05 Inc2). BFF proxea /api/purchase-orders (CASL 'Inventory'
// → staff 403). Dinero/cantidades llegan como string (autoritativos del backend).

export interface CreatePurchaseOrderPayload {
  supplierId: string
  expectedAt?: string
  notes?: string
  items: { ingredientId: string, qtyOrdered: number, unitCost: number }[]
}

export interface ReceivePurchaseOrderPayload {
  id: string
  items: { itemId: string, qtyReceived: number }[]
}

export function usePurchaseOrders() {
  return useQuery({
    key: ['purchase-orders'],
    query: () =>
      $fetch<ApiResponse<PurchaseOrder[]>>('/api/purchase-orders').then(r => r.data),
  })
}

export function usePurchaseOrder(id: MaybeRefOrGetter<string>) {
  return useQuery({
    key: () => ['purchase-orders', toValue(id)] as const,
    query: () =>
      $fetch<ApiResponse<PurchaseOrder>>(`/api/purchase-orders/${toValue(id)}`).then(r => r.data),
  })
}

export function useCreatePurchaseOrder() {
  const cache = useQueryCache()
  return useMutation({
    mutation: (payload: CreatePurchaseOrderPayload) =>
      $fetch<ApiResponse<PurchaseOrder>>('/api/purchase-orders', { method: 'POST', body: payload }).then(r => r.data),
    onSettled: () => cache.invalidateQueries({ key: ['purchase-orders'] }),
  })
}

export function useSendPurchaseOrder() {
  const cache = useQueryCache()
  return useMutation({
    mutation: (id: string) =>
      $fetch<ApiResponse<PurchaseOrder>>(`/api/purchase-orders/${id}/send`, { method: 'POST' }).then(r => r.data),
    onSettled: () => cache.invalidateQueries({ key: ['purchase-orders'] }),
  })
}

export function useCancelPurchaseOrder() {
  const cache = useQueryCache()
  return useMutation({
    mutation: (id: string) =>
      $fetch<ApiResponse<PurchaseOrder>>(`/api/purchase-orders/${id}/cancel`, { method: 'POST' }).then(r => r.data),
    onSettled: () => cache.invalidateQueries({ key: ['purchase-orders'] }),
  })
}

export function useReceivePurchaseOrder() {
  const cache = useQueryCache()
  return useMutation({
    mutation: ({ id, items }: ReceivePurchaseOrderPayload) =>
      $fetch<ApiResponse<PurchaseOrder>>(`/api/purchase-orders/${id}/receive`, {
        method: 'POST',
        body: { items },
      }).then(r => r.data),
    // La recepción mueve inventario → invalidar también stock/ingredientes/movimientos.
    onSettled: () => Promise.all([
      cache.invalidateQueries({ key: ['purchase-orders'] }),
      cache.invalidateQueries({ key: ['ingredients'] }),
      cache.invalidateQueries({ key: ['stock-levels'] }),
      cache.invalidateQueries({ key: ['movements'] }),
      cache.invalidateQueries({ key: ['inventory-alerts'] }),
    ]),
  })
}
