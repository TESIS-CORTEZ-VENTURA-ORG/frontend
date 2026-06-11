import type { ApiResponse } from '#shared/types/api'
import type { AppNotification } from '#shared/types/domain'

export function useNotifications() {
  return useQuery({
    key: ['notifications'],
    query: () =>
      $fetch<ApiResponse<AppNotification[]>>('/api/notifications').then(r => r.data),
  })
}

export function useMarkNotificationsRead() {
  const cache = useQueryCache()
  return useMutation({
    mutation: (id?: string) =>
      $fetch<ApiResponse<AppNotification[]>>('/api/notifications/read', {
        method: 'POST',
        body: { id },
      }).then(r => r.data),
    onSettled: () => cache.invalidateQueries({ key: ['notifications'] }),
  })
}
