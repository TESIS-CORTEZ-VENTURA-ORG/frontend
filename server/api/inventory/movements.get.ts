export default defineEventHandler((event) => {
  const db = useMockDb()
  const { ingredientId } = getQuery(event)

  let movements = db.movements
  if (typeof ingredientId === 'string') {
    movements = movements.filter(m => m.ingredientId === ingredientId)
  }

  return ok(movements, { totalCount: movements.length, page: 1 })
})
