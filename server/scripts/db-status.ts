import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  ensureMigrationsTable,
  getAppliedMigrationNames,
  getPendingMigrationNames,
  listMigrationNames,
} from "../src/infrastructure/supabase/migrationRunner.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, "..");
const rootDir = path.resolve(serverDir, "..");

dotenv.config({ path: path.join(rootDir, ".env") });
dotenv.config({ path: path.join(serverDir, ".env"), override: false });

const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("supabase.com") ? { rejectUnauthorized: false } : undefined,
});

const migrationsDir = path.join(serverDir, "src", "infrastructure", "supabase", "migrations");

await client.connect();
try {
  await ensureMigrationsTable(client);
  const migrationNames = await listMigrationNames(migrationsDir);
  const applied = await getAppliedMigrationNames(client);
  const pending = new Set(getPendingMigrationNames(migrationNames, applied));

  for (const name of migrationNames) {
    console.log(`${pending.has(name) ? "pending" : "applied"}\t${name}`);
  }
} finally {
  await client.end();
}
