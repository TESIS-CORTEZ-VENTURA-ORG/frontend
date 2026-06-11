import type { ApiResponse } from '#shared/types/api'
import type { Ingredient } from '#shared/types/domain'

export function useIngredients(q?: MaybeRefOrGetter<string>) {
  return useQuery({
    key: () => ['ingredients', toValue(q) ?? ''] as const,
    query: () =>
      $fetch<ApiResponse<Ingredient[]>>('/api/ingredients', {
        query: { q: toValue(q) || undefined },
      }).then(r => r.data),
  })
}
