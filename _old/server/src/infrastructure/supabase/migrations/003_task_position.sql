-- Add position column for manual task ordering
-- Uses DOUBLE PRECISION (float) so midpoint inserts never require bulk re-numbering.
-- New rows get EXTRACT(EPOCH FROM NOW()) by default → always appended to the end.

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS position DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Backfill existing rows: assign each task its created_at as a Unix timestamp float.
UPDATE tasks
  SET position = EXTRACT(EPOCH FROM created_at);

-- Switch default to current epoch so every newly inserted task goes to the end.
ALTER TABLE tasks
  ALTER COLUMN position SET DEFAULT EXTRACT(EPOCH FROM NOW());

-- Index for cheap ORDER BY position queries per user.
CREATE INDEX IF NOT EXISTS tasks_position_idx ON tasks (user_id, position);
