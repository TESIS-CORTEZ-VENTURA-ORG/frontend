/**
 * Entidades de dominio que consume el frontend (frontend_context.md §7).
 * Mismo contrato que expondrá la API NestJS; hoy las sirve el mock BFF
 * (`server/api/**` + `server/utils/mock-db.ts`).
 */

// ===== Catálogo =====

export type RecipeKind = 'dish' | 'sub_recipe'

export type StockStatus = 'ok' | 'low' | 'critical'

export interface Ingredient {
  id: string
  name: string
  category: string
  unit: string
  unitCost: number
  stock: number
  minStock: number
  updatedAt: string
  /**
   * Estado del stock frente al mínimo de reorden, calculado por Inventario (E05):
   * `critical` ≤ min·0.5, `low` < min, si no `ok`. El BFF lo fusiona desde
   * `GET /api/inventory/stock`.
   */
  status?: StockStatus
}

export interface RecipeItem {
  ingredientId: string
  name: string
  qty: number
  unit: string
  cost: number
  wastePct: number
}

export interface Recipe {
  id: string
  name: string
  category: string
  kind: RecipeKind
  description?: string
  emoji?: string
  sellPrice: number
  cost: number
  marginPct: number
  items: RecipeItem[]
  active: boolean
  soldToday: number
  prepMinutes?: number
}

// ===== POS / Salón =====

export type TableStatus = 'free' | 'occupied' | 'bill' | 'reserved'

export interface DiningTable {
  id: string
  number: number
  zone: string
  seats: number
  status: TableStatus
  openedAt?: string
  orderId?: string
  waiter?: string
  guests?: number
}

export type OrderItemStatus = 'pending' | 'preparing' | 'served'

export interface OrderItem {
  id: string
  recipeId: string
  name: string
  qty: number
  unitPrice: number
  notes?: string
  status: OrderItemStatus
}

export type DiscountType = 'pct' | 'amount'

export interface OrderDiscount {
  type: DiscountType
  value: number
  reason?: string
}

export type PaymentMethod = 'cash' | 'card' | 'yape' | 'plin'

export interface OrderPayment {
  method: PaymentMethod
  amount: number
}

export type OrderStatus = 'open' | 'paid' | 'void'

export interface Order {
  id: string
  tableId: string
  openedAt: string
  items: OrderItem[]
  discount?: OrderDiscount
  payments: OrderPayment[]
  status: OrderStatus
}

// ===== Ventas / Comprobantes =====

export type SaleDocType = 'boleta' | 'factura'
export type SaleStatus = 'issued' | 'void'

export interface SaleItem {
  name: string
  qty: number
  unitPrice: number
  total: number
}

export interface Sale {
  id: string
  serie: string
  number: number
  docType: SaleDocType
  date: string
  tableLabel?: string
  customer?: string
  customerDoc?: string
  items: SaleItem[]
  subtotal: number
  igv: number
  total: number
  method: PaymentMethod
  status: SaleStatus
}

// HU-04-01 · Pre-cuenta (preview, no persiste). Totales autoritativos del backend
// (moneda string, igual que `SaleView`). El frontend solo los muestra.
export interface PreBillLine {
  name: string
  qty: number
  unitPrice: string
  lineTotal: string
}

export interface PreBill {
  orderId: string
  tableCode: string
  items: PreBillLine[]
  subtotal: string
  igv: string
  total: string
}

// HU-04-03 · División de la cuenta (cómputo de display, no persiste).
export interface SplitShare {
  label: string
  subtotal: string
  igv: string
  total: string
}

export interface SplitResult {
  orderId: string
  mode: 'equal' | 'items'
  shares: SplitShare[]
  total: string
}

// ===== Inventario =====

export type MovementType = 'purchase' | 'sale' | 'waste' | 'adjustment' | 'count'

export interface InventoryMovement {
  id: string
  ingredientId: string
  ingredientName: string
  type: MovementType
  qty: number
  unit: string
  date: string
  note?: string
  user?: string
}

export interface ShoppingItem {
  id: string
  ingredientId: string
  name: string
  suggestedQty: number
  unit: string
  estimatedCost: number
  reason: string
  urgent: boolean
  checked: boolean
}

// ===== Órdenes de Compra (E05 Inc2) =====
// Dinero/cantidades como string (autoritativos del backend); la UI los formatea.
export type PurchaseOrderStatus = 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled'

export interface PurchaseOrderItem {
  id: string
  ingredientId: string
  ingredientName: string
  qtyOrdered: string
  qtyReceived: string
  unitCost: string
  lineTotal: string
}

export interface PurchaseOrder {
  id: string
  supplierId: string
  supplierName: string
  status: PurchaseOrderStatus
  expectedAt: string | null
  notes: string | null
  items: PurchaseOrderItem[]
  total: string
}

// ===== Notificaciones =====

export type NotificationKind = 'critical' | 'warning' | 'info' | 'success'

/** Tipo de dominio del backend (E10, `notificationTypeSchema`). */
export type NotificationType = 'low_stock' | 'order_ready' | 'bill_requested' | 'system'

export interface AppNotification {
  id: string
  /** Severidad visual (icono/color). Derivada del `type` del backend. */
  kind: NotificationKind
  /** Tipo de dominio real del backend (para etiqueta/filtrado). */
  type: NotificationType
  title: string
  body: string
  date: string
  read: boolean
  actionLabel?: string
  actionTo?: string
}

// ===== Settings =====

export interface BusinessSettings {
  name: string
  legalName: string
  ruc: string
  address: string
  district: string
  phone: string
  email: string
}

export interface DayHours {
  day: string
  opens: string
  closes: string
  closed: boolean
}

export interface HoursSettings {
  days: DayHours[]
}

export interface PaymentsSettings {
  cash: boolean
  card: boolean
  yape: boolean
  plin: boolean
  tipPct: number
}

export interface TableZone {
  id: string
  name: string
  tables: number
}

export interface TablesSettings {
  zones: TableZone[]
}

export interface TaxSettings {
  igvPct: number
  pricesIncludeTax: boolean
  boletaSerie: string
  facturaSerie: string
}

export interface MenuSettings {
  showPrices: boolean
  showUnavailable: boolean
  highlightPromos: boolean
}

export interface AppSettings {
  business: BusinessSettings
  hours: HoursSettings
  payments: PaymentsSettings
  tables: TablesSettings
  tax: TaxSettings
  menu: MenuSettings
}

// ===== Chat analítico =====

export interface ChatTableData {
  columns: string[]
  rows: (string | number)[][]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sql?: string
  table?: ChatTableData
  createdAt: string
}

// ===== Ingesta de datos =====

export type IngestionStatus = 'queued' | 'processing' | 'success' | 'error'

export interface IngestionError {
  row: number
  field: string
  message: string
}

export interface Ingestion {
  id: string
  fileName: string
  source: string
  status: IngestionStatus
  totalRows: number
  processedRows: number
  errors: IngestionError[]
  createdAt: string
}
