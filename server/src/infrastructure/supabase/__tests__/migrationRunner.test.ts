import { describe, expect, it } from "vitest";
import { getPendingMigrationNames, sortMigrationNames } from "../migrationRunner.js";

describe("migrationRunner", () => {
  it("sortMigrationNames orders sql migrations lexicographically and ignores non-sql files", () => {
    const sorted = sortMigrationNames([
      "009_task_tags.sql",
      "README.md",
      "003_task_position.sql",
      "001_initial.sql",
      "003_api_keys.sql",
    ]);

    expect(sorted).toEqual([
      "001_initial.sql",
      "003_api_keys.sql",
      "003_task_position.sql",
      "009_task_tags.sql",
    ]);
  });

  it("getPendingMigrationNames excludes already applied migrations", () => {
    const pending = getPendingMigrationNames(
      ["001_initial.sql", "002_task_duration.sql", "007_collaboration.sql"],
      new Set(["001_initial.sql", "002_task_duration.sql"]),
    );

    expect(pending).toEqual(["007_collaboration.sql"]);
  });
});
