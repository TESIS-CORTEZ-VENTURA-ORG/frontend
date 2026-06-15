import { listTables } from '../../utils/pos-adapter'

// Proxy autenticado → backend E03 (TableView[]). El pos-adapter mapea a DiningTable.
export default defineEventHandler(async (event) => {
  const tables = await listTables(event)
  return ok(tables, { totalCount: tables.length, page: 1 })
})
