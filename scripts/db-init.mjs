import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config({ path: path.join(rootDir, 'server', '.env'), override: false });

const migrationsDir = path.join(
  rootDir,
  'server',
  'src',
  'infrastructure',
  'supabase',
  'migrations',
);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('supabase.com') ? { rejectUnauthorized: false } : undefined,
});

await client.connect();
try {
  const migrationFiles = (await fs.readdir(migrationsDir))
    .filter(name => name.endsWith('.sql'))
    .sort();

  for (const filename of migrationFiles) {
    const migrationPath = path.join(migrationsDir, filename);
    const sql = await fs.readFile(migrationPath, 'utf8');
    await client.query(sql);
    console.log(`Applied migration: ${filename}`);
  }
} finally {
  await client.end();
}
