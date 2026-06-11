export default defineEventHandler(() => {
  const db = useMockDb()
  return ok(db.ingestions, { totalCount: db.ingestions.length, page: 1 })
})
