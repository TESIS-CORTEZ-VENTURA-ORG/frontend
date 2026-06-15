import type { ApiResponse } from '#shared/types/api'

// HU-02-04 · Categorías de insumo (jerárquicas). El backend devuelve lista plana;
// el árbol se arma en la pantalla con `parentId`.
export interface CatalogCategory {
  id: string
  name: string
  parentId: string | null
}

export interface CategoryPayload {
  name: string
  parentId?: string | null
}

export function useCatalogCategories() {
  return useQuery({
    key: () => ['catalog-categories'] as const,
    query: () => $fetch<ApiResponse<CatalogCategory[]>>('/api/catalog-categories').then(r => r.data),
  })
}

export function useCreateCategory() {
  const cache = useQueryCache()
  return useMutation({
    mutation: (payload: CategoryPayload) =>
      $fetch<ApiResponse<CatalogCategory>>('/api/catalog-categories', { method: 'POST', body: payload }).then(r => r.data),
    onSettled: () => cache.invalidateQueries({ key: ['catalog-categories'] }),
  })
}

export function useUpdateCategory() {
  const cache = useQueryCache()
  return useMutation({
    mutation: ({ id, ...payload }: CategoryPayload & { id: string }) =>
      $fetch<ApiResponse<CatalogCategory>>(`/api/catalog-categories/${id}`, { method: 'PATCH', body: payload }).then(r => r.data),
    onSettled: () => cache.invalidateQueries({ key: ['catalog-categories'] }),
  })
}

export function useDeleteCategory() {
  const cache = useQueryCache()
  return useMutation({
    mutation: (id: string) =>
      $fetch<ApiResponse<null>>(`/api/catalog-categories/${id}`, { method: 'DELETE' }),
    onSettled: () => cache.invalidateQueries({ key: ['catalog-categories'] }),
  })
}
