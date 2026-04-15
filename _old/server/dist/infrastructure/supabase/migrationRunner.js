import fs from "node:fs/promises";
import path from "node:path";
export const MIGRATIONS_TABLE_NAME = "schema_migrations";
export function sortMigrationNames(names) {
    return [...names]
        .filter((name) => name.endsWith(".sql"))
        .sort((left, right) => left.localeCompare(right));
}
export function getPendingMigrationNames(migrationNames, appliedMigrationNames) {
    return sortMigrationNames(migrationNames).filter((name) => !appliedMigrationNames.has(name));
}
export async function ensureMigrationsTable(client) {
    await client.query(`
    create table if not exists public.${MIGRATIONS_TABLE_NAME} (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `);
}
export async function getAppliedMigrationNames(client) {
    const result = await client.query(`select name from public.${MIGRATIONS_TABLE_NAME} order by name`);
    return new Set(result.rows
        .map((row) => row["name"])
        .filter((value) => typeof value === "string"));
}
export async function listMigrationNames(migrationsDir) {
    const entries = await fs.readdir(migrationsDir);
    return sortMigrationNames(entries);
}
export async function baselineMigrations(client, migrationNames) {
    const applied = [];
    for (const name of sortMigrationNames(migrationNames)) {
        await client.query(`insert into public.${MIGRATIONS_TABLE_NAME} (name) values ($1) on conflict (name) do nothing`, [name]);
        applied.push(name);
    }
    return applied;
}
export async function applyPendingMigrations(client, migrationsDir) {
    const migrationNames = await listMigrationNames(migrationsDir);
    const appliedMigrationNames = await getAppliedMigrationNames(client);
    const pendingMigrationNames = getPendingMigrationNames(migrationNames, appliedMigrationNames);
    const appliedNow = [];
    for (const name of pendingMigrationNames) {
        const sql = await fs.readFile(path.join(migrationsDir, name), "utf8");
        await client.query("begin");
        try {
            await client.query(sql);
            await client.query(`insert into public.${MIGRATIONS_TABLE_NAME} (name) values ($1)`, [name]);
            await client.query("commit");
            appliedNow.push(name);
        }
        catch (error) {
            await client.query("rollback");
            throw error;
        }
    }
    return appliedNow;
}
//# sourceMappingURL=migrationRunner.js.map