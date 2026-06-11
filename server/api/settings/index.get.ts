export default defineEventHandler(() => {
  const db = useMockDb()
  return ok(db.settings)
})
