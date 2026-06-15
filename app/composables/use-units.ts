import type { ApiResponse } from '#shared/types/api'

// HU-02-03 · Unidades de medida. El backend devuelve `factorToBase` ya numérico.
export type UnitFamily = 'mass' | 'volume' | 'count'

export interface Unit {
  id: string
  code: string
  name: string
  family: UnitFamily
  factorToBase: number
}

export interface UnitPayload {
  code: string
  name: string
  family: UnitFamily
  factorToBase: number
}

export interface ConvertResult {
  from: string
  to: string
  qty: number
  result: number
}

export function useUnits() {
  return useQuery({
    key: () => ['units'] as const,
    query: () => $fetch<ApiResponse<Unit[]>>('/api/units').then(r => r.data),
  })
}

export function useCreateUnit() {
  const cache = useQueryCache()
  return useMutation({
    mutation: (payload: UnitPayload) =>
      $fetch<ApiResponse<Unit>>('/api/units', { method: 'POST', body: payload }).then(r => r.data),
    onSettled: () => cache.invalidateQueries({ key: ['units'] }),
  })
}

export function useUpdateUnit() {
  const cache = useQueryCache()
  return useMutation({
    mutation: ({ id, ...payload }: Partial<UnitPayload> & { id: string }) =>
      $fetch<ApiResponse<Unit>>(`/api/units/${id}`, { method: 'PATCH', body: payload }).then(r => r.data),
    onSettled: () => cache.invalidateQueries({ key: ['units'] }),
  })
}

export function useDeleteUnit() {
  const cache = useQueryCache()
  return useMutation({
    mutation: (id: string) =>
      $fetch<ApiResponse<null>>(`/api/units/${id}`, { method: 'DELETE' }),
    onSettled: () => cache.invalidateQueries({ key: ['units'] }),
  })
}

/** Conversión puntual entre unidades de la misma familia (HU-02-03). */
export function convertUnit(qty: number, from: string, to: string) {
  return $fetch<ApiResponse<ConvertResult>>('/api/units/convert', {
    query: { qty, from, to },
  }).then(r => r.data)
}
