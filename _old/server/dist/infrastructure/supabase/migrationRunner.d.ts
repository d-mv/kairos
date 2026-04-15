type DbClient = {
    query(sql: string, params?: readonly unknown[]): Promise<{
        rows: Array<Record<string, unknown>>;
    }>;
};
export declare const MIGRATIONS_TABLE_NAME = "schema_migrations";
export declare function sortMigrationNames(names: string[]): string[];
export declare function getPendingMigrationNames(migrationNames: string[], appliedMigrationNames: ReadonlySet<string>): string[];
export declare function ensureMigrationsTable(client: DbClient): Promise<void>;
export declare function getAppliedMigrationNames(client: DbClient): Promise<Set<string>>;
export declare function listMigrationNames(migrationsDir: string): Promise<string[]>;
export declare function baselineMigrations(client: DbClient, migrationNames: string[]): Promise<string[]>;
export declare function applyPendingMigrations(client: DbClient, migrationsDir: string): Promise<string[]>;
export {};
//# sourceMappingURL=migrationRunner.d.ts.map