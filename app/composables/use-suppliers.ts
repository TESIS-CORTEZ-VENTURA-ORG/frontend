import type { ApiResponse } from '#shared/types/api'

// HU-02-05 · Proveedores. RUC 11 dígitos; `leadTimeDays` numérico/null.
export interface Supplier {
  id: string
  ruc: string
  name: string
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  paymentTerms: string | null
  leadTimeDays: number | null
  active: boolean
}

export interface SupplierPayload {
  ruc: string
  name: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  paymentTerms?: string
  leadTimeDays?: number
  active?: boolean
}

export function useSuppliers() {
  return useQuery({
    key: () => ['suppliers'] as const,
    query: () => $fetch<ApiResponse<Supplier[]>>('/api/suppliers').then(r => r.data),
  })
}

export function useSupplier(id: MaybeRefOrGetter<string>) {
  return useQuery({
    key: () => ['suppliers', toValue(id)] as const,
    query: () => $fetch<ApiResponse<Supplier>>(`/api/suppliers/${toValue(id)}`).then(r => r.data),
  })
}

export function useCreateSupplier() {
  const cache = useQueryCache()
  return useMutation({
    mutation: (payload: SupplierPayload) =>
      $fetch<ApiResponse<Supplier>>('/api/suppliers', { method: 'POST', body: payload }).then(r => r.data),
    onSettled: () => cache.invalidateQueries({ key: ['suppliers'] }),
  })
}

export function useUpdateSupplier() {
  const cache = useQueryCache()
  return useMutation({
    mutation: ({ id, ...payload }: Partial<SupplierPayload> & { id: string }) =>
      $fetch<ApiResponse<Supplier>>(`/api/suppliers/${id}`, { method: 'PATCH', body: payload }).then(r => r.data),
    onSettled: () => cache.invalidateQueries({ key: ['suppliers'] }),
  })
}

export function useDeleteSupplier() {
  const cache = useQueryCache()
  return useMutation({
    mutation: (id: string) =>
      $fetch<ApiResponse<null>>(`/api/suppliers/${id}`, { method: 'DELETE' }),
    onSettled: () => cache.invalidateQueries({ key: ['suppliers'] }),
  })
}
