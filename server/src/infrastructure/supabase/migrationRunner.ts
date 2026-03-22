import fs from "node:fs/promises";
import path from "node:path";

type DbClient = {
  query(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: Array<Record<string, unknown>> }>;
};

export const MIGRATIONS_TABLE_NAME = "schema_migrations";

export function sortMigrationNames(names: string[]): string[] {
  return [...names]
    .filter((name) => name.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));
}

export function getPendingMigrationNames(
  migrationNames: string[],
  appliedMigrationNames: ReadonlySet<string>,
): string[] {
  return sortMigrationNames(migrationNames).filter((name) => !appliedMigrationNames.has(name));
}

export async function ensureMigrationsTable(client: DbClient): Promise<void> {
  await client.query(`
    create table if not exists public.${MIGRATIONS_TABLE_NAME} (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `);
}

export async function getAppliedMigrationNames(client: DbClient): Promise<Set<string>> {
  const result = await client.query(
    `select name from public.${MIGRATIONS_TABLE_NAME} order by name`,
  );
  return new Set(
    result.rows
      .map((row) => row["name"])
      .filter((value): value is string => typeof value === "string"),
  );
}

export async function listMigrationNames(migrationsDir: string): Promise<string[]> {
  const entries = await fs.readdir(migrationsDir);
  return sortMigrationNames(entries);
}

export async function baselineMigrations(
  client: DbClient,
  migrationNames: string[],
): Promise<string[]> {
  const applied: string[] = [];
  for (const name of sortMigrationNames(migrationNames)) {
    await client.query(
      `insert into public.${MIGRATIONS_TABLE_NAME} (name) values ($1) on conflict (name) do nothing`,
      [name],
    );
    applied.push(name);
  }
  return applied;
}

export async function applyPendingMigrations(
  client: DbClient,
  migrationsDir: string,
): Promise<string[]> {
  const migrationNames = await listMigrationNames(migrationsDir);
  const appliedMigrationNames = await getAppliedMigrationNames(client);
  const pendingMigrationNames = getPendingMigrationNames(migrationNames, appliedMigrationNames);
  const appliedNow: string[] = [];

  for (const name of pendingMigrationNames) {
    const sql = await fs.readFile(path.join(migrationsDir, name), "utf8");
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query(`insert into public.${MIGRATIONS_TABLE_NAME} (name) values ($1)`, [name]);
      await client.query("commit");
      appliedNow.push(name);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }

  return appliedNow;
}
