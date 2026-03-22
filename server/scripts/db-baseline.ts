import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { baselineMigrations, ensureMigrationsTable } from "../src/infrastructure/supabase/migrationRunner.js";

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

const migrationNames = process.argv.slice(2);
if (migrationNames.length === 0) {
  console.error("Usage: pnpm --filter server db:baseline <migration.sql> [more.sql]");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("supabase.com") ? { rejectUnauthorized: false } : undefined,
});

await client.connect();
try {
  await ensureMigrationsTable(client);
  const baselined = await baselineMigrations(client, migrationNames);
  for (const name of baselined) console.log(`Baselined migration: ${name}`);
} finally {
  await client.end();
}
