import { error } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { categories } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ params }) => {
  const { category } = params;

  const [categoryRecord] = await db
    .select()
    .from(categories)
    .where(eq(categories.name, category))
    .limit(1);

  if (!categoryRecord)
    error(404, "Category not found");

  return {
    category: categoryRecord
  };
};
