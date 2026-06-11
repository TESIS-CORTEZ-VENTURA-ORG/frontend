import type { ApiResponse } from '#shared/types/api'
import type { AppSettings } from '#shared/types/domain'

export function useAppSettings() {
  return useQuery({
    key: ['settings'],
    query: () => $fetch<ApiResponse<AppSettings>>('/api/settings').then(r => r.data),
  })
}

export function useUpdateSettings<S extends keyof AppSettings>(section: S) {
  const cache = useQueryCache()
  return useMutation({
    mutation: (payload: Partial<AppSettings[S]>) =>
      $fetch<ApiResponse<AppSettings[S]>>(`/api/settings/${section}`, {
        method: 'PATCH',
        body: payload,
      }).then(r => r.data),
    onSettled: () => cache.invalidateQueries({ key: ['settings'] }),
  })
}
