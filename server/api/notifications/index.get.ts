export default defineEventHandler(() => {
  const db = useMockDb()
  return ok(db.notifications, { totalCount: db.notifications.length, page: 1 })
})
