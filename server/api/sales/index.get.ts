export default defineEventHandler((event) => {
  const db = useMockDb()
  const { q, docType } = getQuery(event)

  let sales = db.sales
  if (typeof docType === 'string' && (docType === 'boleta' || docType === 'factura')) {
    sales = sales.filter(s => s.docType === docType)
  }
  if (typeof q === 'string' && q.trim()) {
    const needle = q.trim().toLowerCase()
    sales = sales.filter(s =>
      `${s.serie}-${s.number}`.toLowerCase().includes(needle)
      || (s.customer ?? '').toLowerCase().includes(needle)
      || (s.tableLabel ?? '').toLowerCase().includes(needle),
    )
  }

  return ok(sales, { totalCount: sales.length, page: 1 })
})
