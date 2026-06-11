import type { ChatTableData } from '#shared/types/domain'

interface ScriptedAnswer {
  match: RegExp
  sql: string
  table: ChatTableData
  answer: string
}

// Respuestas guionadas del demo — la API real genera esto con Claude + RAG (E09)
const SCRIPTS: ScriptedAnswer[] = [
  {
    match: /margen|rentab|ganancia/i,
    sql: `SELECT r.name, r.sell_price, r.cost,\n       ROUND((r.sell_price - r.cost) / r.sell_price * 100) AS margin_pct\nFROM recipes r\nWHERE r.tenant_id = current_tenant()\nORDER BY margin_pct DESC\nLIMIT 5;`,
    table: {
      columns: ['Plato', 'Precio', 'Costo', 'Margen'],
      rows: [
        ['Cuba Libre', 'S/ 20.00', 'S/ 4.90', '76 %'],
        ['Chilcano de Pisco', 'S/ 22.00', 'S/ 5.50', '75 %'],
        ['Pisco Sour', 'S/ 25.00', 'S/ 6.20', '75 %'],
        ['Maracuyá Sour', 'S/ 26.00', 'S/ 6.80', '74 %'],
        ['Chicharrón de Pollo', 'S/ 24.00', 'S/ 7.20', '70 %'],
      ],
    },
    answer: 'Tus productos más rentables son los **cocteles**: Cuba Libre (76 %), Chilcano (75 %) y Pisco Sour (75 %). En platos, el Chicharrón de Pollo lidera con 70 % de margen. Ojo: el Ceviche Clásico cayó a 18 % por el alza del limón — te conviene revisar su precio o porción.',
  },
  {
    match: /vend|venta|top|popular/i,
    sql: `SELECT r.name, SUM(si.qty) AS sold, SUM(si.qty * si.unit_price) AS revenue\nFROM sale_items si\nJOIN recipes r ON r.id = si.recipe_id\nWHERE si.created_at >= date_trunc('week', now())\nGROUP BY r.name ORDER BY sold DESC LIMIT 5;`,
    table: {
      columns: ['Plato', 'Vendidos', 'Ingresos'],
      rows: [
        ['Pisco Sour', 31, 'S/ 775.00'],
        ['Ceviche Clásico', 22, 'S/ 836.00'],
        ['Chilcano de Pisco', 19, 'S/ 418.00'],
        ['Lomo Saltado', 18, 'S/ 648.00'],
        ['Chicharrón de Pollo', 16, 'S/ 384.00'],
      ],
    },
    answer: 'Esta semana tu **Pisco Sour** es el más vendido (31 unidades), pero el **Ceviche Clásico** genera más ingresos: S/ 836. El viernes y sábado concentran el 62 % de las ventas — asegúrate de tener stock de limón y lenguado para el fin de semana.',
  },
  {
    match: /stock|insumo|inventario|compra/i,
    sql: `SELECT i.name, i.stock, i.min_stock, i.unit\nFROM ingredients i\nWHERE i.tenant_id = current_tenant() AND i.stock < i.min_stock\nORDER BY i.stock / i.min_stock ASC;`,
    table: {
      columns: ['Insumo', 'Stock', 'Mínimo', 'Unidad'],
      rows: [
        ['Cilantro', 0.2, 0.5, 'kg'],
        ['Limón Sutil', 2.5, 5, 'kg'],
        ['Aceite de Oliva', 2, 4, 'L'],
      ],
    },
    answer: 'Tienes **3 insumos en estado crítico**: Cilantro (200 g de 500 g mínimos), Limón Sutil (2.5 kg de 5 kg) y Aceite de Oliva (2 L de 4 L). Con el consumo actual, el limón se agota mañana al mediodía. Ya generé la lista de compra sugerida: S/ 254.88 en total.',
  },
]

const DEFAULT_SCRIPT: ScriptedAnswer = {
  match: /.*/,
  sql: `SELECT date_trunc('day', s.created_at) AS day,\n       SUM(s.total) AS revenue\nFROM sales s\nWHERE s.tenant_id = current_tenant()\n  AND s.created_at >= now() - interval '7 days'\nGROUP BY day ORDER BY day;`,
  table: {
    columns: ['Día', 'Ventas'],
    rows: [
      ['Jueves', 'S/ 1,820'],
      ['Viernes', 'S/ 3,150'],
      ['Sábado', 'S/ 3,890'],
      ['Domingo', 'S/ 2,440'],
      ['Lunes', 'cerrado'],
      ['Martes', 'S/ 1,610'],
      ['Hoy', 'S/ 2,450'],
    ],
  },
  answer: 'En los últimos 7 días facturaste **S/ 15,360**, con el sábado como tu mejor día (S/ 3,890). Hoy vas en S/ 2,450, un 12 % arriba del miércoles pasado. ¿Quieres que desglose por categoría o por mozo?',
}

export default defineEventHandler(async (event) => {
  const { q } = getQuery(event)
  const question = typeof q === 'string' ? q : ''
  const script = SCRIPTS.find(s => s.match.test(question)) ?? DEFAULT_SCRIPT

  const stream = createEventStream(event)
  const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

  const run = async (): Promise<void> => {
    await sleep(400)
    await stream.push({ event: 'sql', data: JSON.stringify({ sql: script.sql }) })
    await sleep(700)
    await stream.push({ event: 'rows', data: JSON.stringify(script.table) })
    await sleep(500)

    const words = script.answer.split(' ')
    for (let i = 0; i < words.length; i += 3) {
      const chunk = words.slice(i, i + 3).join(' ')
      await stream.push({ event: 'chunk', data: JSON.stringify({ text: `${chunk} ` }) })
      await sleep(60)
    }

    await stream.push({ event: 'done', data: JSON.stringify({ ok: true }) })
    await stream.close()
  }

  run().catch(() => stream.close())

  return stream.send()
})
