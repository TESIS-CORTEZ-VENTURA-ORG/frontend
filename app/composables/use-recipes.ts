import type { ApiResponse } from '#shared/types/api'
import type { Recipe } from '#shared/types/domain'

export interface RecipeFilters {
  q?: string
  category?: string
  kind?: Recipe['kind']
}

export function useRecipes(filters?: MaybeRefOrGetter<RecipeFilters>) {
  return useQuery({
    key: () => ['recipes', toValue(filters) ?? {}] as const,
    query: () =>
      $fetch<ApiResponse<Recipe[]>>('/api/recipes', { query: toValue(filters) })
        .then(r => r.data),
  })
}

export function useRecipe(id: MaybeRefOrGetter<string>) {
  return useQuery({
    key: () => ['recipes', toValue(id)] as const,
    query: () =>
      $fetch<ApiResponse<Recipe>>(`/api/recipes/${toValue(id)}`).then(r => r.data),
  })
}

export interface RecipePayload {
  name: string
  category: string
  kind?: Recipe['kind']
  description?: string
  emoji?: string
  sellPrice: number
  items: Recipe['items']
  prepMinutes?: number
  active?: boolean
}

export function useCreateRecipe() {
  const cache = useQueryCache()
  return useMutation({
    mutation: (payload: RecipePayload) =>
      $fetch<ApiResponse<Recipe>>('/api/recipes', { method: 'POST', body: payload })
        .then(r => r.data),
    onSettled: () => cache.invalidateQueries({ key: ['recipes'] }),
  })
}

export function useUpdateRecipe() {
  const cache = useQueryCache()
  return useMutation({
    mutation: ({ id, ...payload }: Partial<RecipePayload> & { id: string }) =>
      $fetch<ApiResponse<Recipe>>(`/api/recipes/${id}`, { method: 'PATCH', body: payload })
        .then(r => r.data),
    onSettled: () => cache.invalidateQueries({ key: ['recipes'] }),
  })
}

export function useDeleteRecipe() {
  const cache = useQueryCache()
  return useMutation({
    mutation: (id: string) =>
      $fetch<ApiResponse<null>>(`/api/recipes/${id}`, { method: 'DELETE' }),
    onSettled: () => cache.invalidateQueries({ key: ['recipes'] }),
  })
}
