import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"

const sqlite = new Database(process.env.DATABASE_URL)
const db = drizzle(sqlite)

async function main() {
  console.log("[migrate] applying pending migrations…");

  migrate(db, { migrationsFolder: "./drizzle" })
  console.log("[migrate] done");
}

main().catch((err) => {
  console.error("[migrate] failed", err);
  process.exit(1);
});
