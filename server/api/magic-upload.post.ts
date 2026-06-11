import { z } from 'zod'

const magicUploadSchema = z.object({
  fileName: z.string().min(1),
})

/**
 * Simula el OCR de una factura de proveedor (Magic Upload):
 * devuelve líneas extraídas listas para confirmar como compra.
 */
export default defineEventHandler(async (event) => {
  await readValidatedBody(event, magicUploadSchema.parse)

  // Latencia del "modelo de visión"
  await new Promise(resolve => setTimeout(resolve, 1800))

  return ok({
    vendor: 'Distribuidora Frutos del Campo S.A.C.',
    ruc: '20498765432',
    date: new Date().toISOString().slice(0, 10),
    confidence: 0.94,
    lines: [
      { ingredientId: 'ing-01', name: 'Limón Sutil', qty: 8, unit: 'kg', unitCost: 9.4, total: 75.2 },
      { ingredientId: 'ing-07', name: 'Cilantro', qty: 1, unit: 'kg', unitCost: 11.5, total: 11.5 },
      { ingredientId: 'ing-03', name: 'Cebolla Roja', qty: 5, unit: 'kg', unitCost: 3.1, total: 15.5 },
      { ingredientId: null, name: 'Rocoto Fresco', qty: 2, unit: 'kg', unitCost: 6.8, total: 13.6 },
    ],
    total: 115.8,
  })
})
