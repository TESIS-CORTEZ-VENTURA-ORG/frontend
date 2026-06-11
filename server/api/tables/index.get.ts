export default defineEventHandler(() => {
  const db = useMockDb()
  return ok(db.tables, { totalCount: db.tables.length, page: 1 })
})
