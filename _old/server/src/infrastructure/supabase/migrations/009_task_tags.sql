-- Add tags support for tasks.
-- tags are stored as an array of text values.

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
