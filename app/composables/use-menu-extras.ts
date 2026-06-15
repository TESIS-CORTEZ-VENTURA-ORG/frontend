import type { ApiResponse } from '#shared/types/api'

// HU-02-11 (modificadores) y HU-02-13 (disponibilidad) — cuelgan del plato (recipeId).

export interface Modifier {
  id: string
  name: string
  priceDelta: number
  required: boolean
  position: number
}
export interface Availability {
  id: string
  dayOfWeek: number | null
  startMinute: number
  endMinute: number
}

export function useModifiers(recipeId: MaybeRefOrGetter<string>) {
  return useQuery({
    key: () => ['modifiers', toValue(recipeId)] as const,
    query: () =>
      $fetch<ApiResponse<Modifier[]>>(`/api/recipes/${toValue(recipeId)}/modifiers`).then(r => r.data),
  })
}

export function useAddModifier(recipeId: MaybeRefOrGetter<string>) {
  const cache = useQueryCache()
  return useMutation({
    mutation: (body: { name: string, priceDelta?: number, required?: boolean }) =>
      $fetch<ApiResponse<Modifier>>(`/api/recipes/${toValue(recipeId)}/modifiers`, {
        method: 'POST',
        body,
      }).then(r => r.data),
    onSettled: () => cache.invalidateQueries({ key: ['modifiers', toValue(recipeId)] }),
  })
}

export function useRemoveModifier(recipeId: MaybeRefOrGetter<string>) {
  const cache = useQueryCache()
  return useMutation({
    mutation: (modifierId: string) =>
      $fetch(`/api/recipes/modifiers/${modifierId}`, { method: 'DELETE' }),
    onSettled: () => cache.invalidateQueries({ key: ['modifiers', toValue(recipeId)] }),
  })
}

export function useAvailability(recipeId: MaybeRefOrGetter<string>) {
  return useQuery({
    key: () => ['availability', toValue(recipeId)] as const,
    query: () =>
      $fetch<ApiResponse<Availability[]>>(`/api/recipes/${toValue(recipeId)}/availability`).then(r => r.data),
  })
}

export function useAddAvailability(recipeId: MaybeRefOrGetter<string>) {
  const cache = useQueryCache()
  return useMutation({
    mutation: (body: { dayOfWeek?: number | null, startMinute: number, endMinute: number }) =>
      $fetch<ApiResponse<Availability>>(`/api/recipes/${toValue(recipeId)}/availability`, {
        method: 'POST',
        body,
      }).then(r => r.data),
    onSettled: () => cache.invalidateQueries({ key: ['availability', toValue(recipeId)] }),
  })
}

export function useRemoveAvailability(recipeId: MaybeRefOrGetter<string>) {
  const cache = useQueryCache()
  return useMutation({
    mutation: (availabilityId: string) =>
      $fetch(`/api/recipes/availability/${availabilityId}`, { method: 'DELETE' }),
    onSettled: () => cache.invalidateQueries({ key: ['availability', toValue(recipeId)] }),
  })
}
