import type { ApiResponse } from '#shared/types/api'

// HU-02-06 · Asociación insumo ↔ proveedor. `lastPrice` llega como string
// (Decimal .toFixed(2)) o null desde el backend.
export interface ProductSupplier {
  id: string
  supplierId: string
  supplierName: string
  supplierSku: string | null
  lastPrice: string | null
  preferred: boolean
}

export interface LinkSupplierPayload {
  ingredientId: string
  supplierId: string
  supplierSku?: string
  lastPrice?: number
  preferred?: boolean
}

export function useProductSuppliers(ingredientId: MaybeRefOrGetter<string>) {
  return useQuery({
    key: () => ['product-suppliers', toValue(ingredientId)] as const,
    query: () =>
      $fetch<ApiResponse<ProductSupplier[]>>('/api/product-suppliers', {
        query: { ingredientId: toValue(ingredientId) },
      }).then(r => r.data),
    enabled: () => Boolean(toValue(ingredientId)),
  })
}

export function useLinkSupplier() {
  const cache = useQueryCache()
  return useMutation({
    mutation: (payload: LinkSupplierPayload) =>
      $fetch<ApiResponse<ProductSupplier>>('/api/product-suppliers', { method: 'POST', body: payload }).then(r => r.data),
    onSettled: () => cache.invalidateQueries({ key: ['product-suppliers'] }),
  })
}

export function useUnlinkSupplier() {
  const cache = useQueryCache()
  return useMutation({
    mutation: ({ ingredientId, supplierId }: { ingredientId: string, supplierId: string }) =>
      $fetch<ApiResponse<null>>('/api/product-suppliers', {
        method: 'DELETE',
        query: { ingredientId, supplierId },
      }),
    onSettled: () => cache.invalidateQueries({ key: ['product-suppliers'] }),
  })
}
