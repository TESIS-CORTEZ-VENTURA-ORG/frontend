export default defineEventHandler(() => {
  const db = useMockDb()
  return ok(db.shoppingList, { totalCount: db.shoppingList.length, page: 1 })
})
