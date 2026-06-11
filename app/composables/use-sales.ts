import type { ApiResponse } from '#shared/types/api'
import type { Sale } from '#shared/types/domain'

export interface SaleFilters {
  q?: string
  docType?: Sale['docType']
}

export function useSales(filters?: MaybeRefOrGetter<SaleFilters>) {
  return useQuery({
    key: () => ['sales', toValue(filters) ?? {}] as const,
    query: () =>
      $fetch<ApiResponse<Sale[]>>('/api/sales', { query: toValue(filters) }).then(r => r.data),
  })
}

export function useSale(id: MaybeRefOrGetter<string>) {
  return useQuery({
    key: () => ['sales', toValue(id)] as const,
    query: () =>
      $fetch<ApiResponse<Sale>>(`/api/sales/${toValue(id)}`).then(r => r.data),
  })
}
