import type { H3Event } from 'h3'
import type { Ingredient, Recipe, RecipeItem } from '#shared/types/domain'
import { backendFetch } from './backend'

/**
 * Adaptador E02 (anti-corruption layer del BFF). El backend NestJS separa
 * Recipe (BOM/costo) de MenuItem (precio/margen/categoría); el frontend trata la
 * "receta" como el plato vendible. Aquí se traduce backend ⇄ frontend para que
 * las pantallas Vue no cambien su contrato (`shared/types/domain.ts`).
 */

interface Envelope<T> { success: boolean, data: T }

const SUB_RECIPE_CATEGORY = 'Bases'

// ---- Formas del backend ----
interface BeRecipeSummary {
  id: string
  name: string
  kind: 'dish' | 'sub_recipe'
  yield: string
  version: number
  emoji: string | null
  description: string | null
  prepMinutes: number | null
  costPerYield: string
}
interface BeRecipeItem {
  id: string
  ingredientId: string | null
  subRecipeId: string | null
  qty: string
  wasteFactor: string
  lineCost: string
}
interface BeRecipeView extends BeRecipeSummary {
  totalCost: string
  items: BeRecipeItem[]
}
interface BeMenuItem {
  id: string
  name: string
  recipeId: string
  menuCategoryId: string | null
  price: string
  imageUrl: string | null
  isActive: boolean
  unitCost: string
  marginPct: string
  lowMargin: boolean
}
interface BeMenuCategory { id: string, name: string, position: number, isActive: boolean }
interface BeIngredient {
  id: string
  sku: string
  name: string
  type: string
  unit: string
  category: string | null
  unitCost: string
  updatedAt: string
}

const num = (s: string | null | undefined): number => (s == null ? 0 : Number(s))
const marginOf = (sellPrice: number, cost: number): number =>
  sellPrice > 0 ? Math.round(((sellPrice - cost) / sellPrice) * 100) : 0

// ---- Insumos ----
export function toFrontendIngredient(b: BeIngredient): Ingredient {
  return {
    id: b.id,
    name: b.name,
    category: b.category ?? '',
    unit: b.unit,
    unitCost: num(b.unitCost),
    // stock/mínimos pertenecen a Inventario (E05, aún no construido) → pendientes.
    stock: 0,
    minStock: 0,
    stockPending: true,
    updatedAt: b.updatedAt,
  }
}

// ---- Recetas (lista) ----
async function fetchMenuMaps(event: H3Event) {
  const [items, cats] = await Promise.all([
    backendFetch<Envelope<BeMenuItem[]>>(event, '/api/menu/items'),
    backendFetch<Envelope<BeMenuCategory[]>>(event, '/api/menu/categories'),
  ])
  const itemByRecipe = new Map<string, BeMenuItem>()
  for (const it of items.data) itemByRecipe.set(it.recipeId, it)
  const catName = new Map<string, string>()
  for (const c of cats.data) catName.set(c.id, c.name)
  return { itemByRecipe, catName }
}

function summaryToRecipe(
  r: BeRecipeSummary,
  item: BeMenuItem | undefined,
  catName: Map<string, string>,
): Recipe {
  const cost = num(r.costPerYield)
  const sellPrice = item ? num(item.price) : 0
  const category = item
    ? (item.menuCategoryId ? catName.get(item.menuCategoryId) ?? 'Sin categoría' : 'Sin categoría')
    : SUB_RECIPE_CATEGORY
  return {
    id: r.id,
    name: r.name,
    category,
    kind: r.kind,
    description: r.description ?? undefined,
    emoji: r.emoji ?? undefined,
    sellPrice,
    cost,
    marginPct: marginOf(sellPrice, cost),
    items: [],
    active: item ? item.isActive : true,
    soldToday: 0,
    prepMinutes: r.prepMinutes ?? undefined,
  }
}

export async function listRecipes(event: H3Event): Promise<Recipe[]> {
  const recipes = await backendFetch<Envelope<BeRecipeSummary[]>>(event, '/api/recipes')
  const { itemByRecipe, catName } = await fetchMenuMaps(event)
  return recipes.data.map(r => summaryToRecipe(r, itemByRecipe.get(r.id), catName))
}

// ---- Receta (detalle, con BOM completo) ----
export async function buildRecipeDetail(event: H3Event, id: string): Promise<Recipe> {
  const [view, ingredients, allRecipes] = await Promise.all([
    backendFetch<Envelope<BeRecipeView>>(event, `/api/recipes/${id}`),
    backendFetch<Envelope<BeIngredient[]>>(event, '/api/ingredients'),
    backendFetch<Envelope<BeRecipeSummary[]>>(event, '/api/recipes'),
  ])
  const { itemByRecipe, catName } = await fetchMenuMaps(event)
  const ingById = new Map(ingredients.data.map(i => [i.id, i]))
  const recById = new Map(allRecipes.data.map(r => [r.id, r]))

  const base = summaryToRecipe(view.data, itemByRecipe.get(id), catName)
  const items: RecipeItem[] = view.data.items.map((it) => {
    const ing = it.ingredientId ? ingById.get(it.ingredientId) : undefined
    const sub = it.subRecipeId ? recById.get(it.subRecipeId) : undefined
    return {
      ingredientId: it.ingredientId ?? it.subRecipeId ?? '',
      name: ing?.name ?? sub?.name ?? '—',
      qty: num(it.qty),
      unit: ing?.unit ?? 'porción',
      cost: num(it.lineCost),
      wastePct: Math.round(num(it.wasteFactor) * 100),
    }
  })
  return { ...base, items }
}

// ---- Crear / actualizar ----
interface RecipePayload {
  name: string
  category: string
  kind?: 'dish' | 'sub_recipe'
  description?: string
  emoji?: string
  sellPrice: number
  items: RecipeItem[]
  prepMinutes?: number
  active?: boolean
}

function toBackendItems(items: RecipeItem[]) {
  return items.map(it => ({
    ingredientId: it.ingredientId,
    qty: it.qty,
    wasteFactor: (it.wastePct ?? 0) / 100,
  }))
}

/** Resuelve (o crea) la categoría de menú por nombre → id. */
async function resolveMenuCategoryId(event: H3Event, name: string): Promise<string> {
  const cats = await backendFetch<Envelope<BeMenuCategory[]>>(event, '/api/menu/categories')
  const found = cats.data.find(c => c.name.toLowerCase() === name.toLowerCase())
  if (found) return found.id
  const created = await backendFetch<Envelope<BeMenuCategory>>(event, '/api/menu/categories', {
    method: 'POST',
    body: { name },
  })
  return created.data.id
}

export async function createRecipe(event: H3Event, payload: RecipePayload): Promise<Recipe> {
  const kind = payload.kind ?? 'dish'
  const recipe = await backendFetch<Envelope<BeRecipeView>>(event, '/api/recipes', {
    method: 'POST',
    body: {
      name: payload.name,
      kind,
      emoji: payload.emoji,
      description: payload.description,
      prepMinutes: payload.prepMinutes,
      items: toBackendItems(payload.items),
    },
  })
  if (kind === 'dish') {
    const menuCategoryId = payload.category
      ? await resolveMenuCategoryId(event, payload.category)
      : undefined
    await backendFetch<Envelope<BeMenuItem>>(event, '/api/menu/items', {
      method: 'POST',
      body: {
        recipeId: recipe.data.id,
        name: payload.name,
        price: payload.sellPrice,
        menuCategoryId,
        isActive: payload.active ?? true,
      },
    })
  }
  return buildRecipeDetail(event, recipe.data.id)
}

export async function updateRecipe(
  event: H3Event,
  id: string,
  payload: Partial<RecipePayload>,
): Promise<Recipe> {
  const recipeBody: Record<string, unknown> = {}
  if (payload.name !== undefined) recipeBody.name = payload.name
  if (payload.emoji !== undefined) recipeBody.emoji = payload.emoji
  if (payload.description !== undefined) recipeBody.description = payload.description
  if (payload.prepMinutes !== undefined) recipeBody.prepMinutes = payload.prepMinutes
  if (payload.items !== undefined) recipeBody.items = toBackendItems(payload.items)
  if (Object.keys(recipeBody).length > 0) {
    await backendFetch<Envelope<BeRecipeView>>(event, `/api/recipes/${id}`, {
      method: 'PATCH',
      body: recipeBody,
    })
  }

  // Datos de venta (precio/estado/categoría/nombre) viven en el MenuItem.
  const touchesMenu =
    payload.sellPrice !== undefined
    || payload.active !== undefined
    || payload.category !== undefined
    || payload.name !== undefined
  if (touchesMenu) {
    const items = await backendFetch<Envelope<BeMenuItem[]>>(event, '/api/menu/items')
    const item = items.data.find(it => it.recipeId === id)
    if (item) {
      const menuBody: Record<string, unknown> = {}
      if (payload.name !== undefined) menuBody.name = payload.name
      if (payload.sellPrice !== undefined) menuBody.price = payload.sellPrice
      if (payload.active !== undefined) menuBody.isActive = payload.active
      if (payload.category !== undefined) {
        menuBody.menuCategoryId = await resolveMenuCategoryId(event, payload.category)
      }
      await backendFetch<Envelope<BeMenuItem>>(event, `/api/menu/items/${item.id}`, {
        method: 'PATCH',
        body: menuBody,
      })
    }
  }
  return buildRecipeDetail(event, id)
}

export async function deleteRecipe(event: H3Event, id: string): Promise<void> {
  // El backend bloquea borrar una receta usada por un plato → borrar el MenuItem primero.
  const items = await backendFetch<Envelope<BeMenuItem[]>>(event, '/api/menu/items')
  const item = items.data.find(it => it.recipeId === id)
  if (item) {
    await backendFetch<Envelope<unknown>>(event, `/api/menu/items/${item.id}`, { method: 'DELETE' })
  }
  await backendFetch<Envelope<unknown>>(event, `/api/recipes/${id}`, { method: 'DELETE' })
}
