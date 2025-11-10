import { db } from "$lib/server/db"
import { categories } from "$lib/server/db/schema"
import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async ({ params }) => {
  const queryCategories = await db.select().from(categories)

  return {
    categories: queryCategories
  }
}
