import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

let pool = null;
let db = null;

export function getDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return null;
  }

  if (!db) {
    pool = new Pool({ connectionString });
    db = drizzle(pool);
  }

  return db;
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}
