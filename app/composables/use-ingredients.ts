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

export function useUpdateIngredient() {
  const cache = useQueryCache()
  return useMutation({
    mutation: ({ id, ...payload }: { id: string, name?: string, category?: string, unit?: string, unitCost?: number, minStock?: number, stock?: number }) =>
      $fetch<ApiResponse<Ingredient>>(`/api/ingredients/${id}`, {
        method: 'PATCH',
        body: payload,
      }).then(r => r.data),
    onSettled: () => cache.invalidateQueries({ key: ['ingredients'] }),
  })
}

// HU-02-02 · Carga masiva de insumos vía CSV. Devuelve el reporte (creados/
// actualizados/errores con línea exacta). Es idempotente (rerun → actualiza).
export interface ImportReport {
  total: number
  created: number
  updated: number
  failed: number
  errors: { line: number, message: string }[]
}

export function useImportIngredients() {
  const cache = useQueryCache()
  return useMutation({
    mutation: (content: string) =>
      $fetch<ApiResponse<ImportReport>>('/api/ingredients/import', {
        method: 'POST',
        body: { content },
      }).then(r => r.data),
    onSettled: () => cache.invalidateQueries({ key: ['ingredients'] }),
  })
}
