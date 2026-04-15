-- Migration: Change tasks.due_date from DATE to TIMESTAMPTZ to support time
ALTER TABLE tasks ALTER COLUMN due_date TYPE TIMESTAMPTZ USING due_date::TIMESTAMPTZ;
