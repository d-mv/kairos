ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS duration INTEGER,
  ADD COLUMN IF NOT EXISTS duration_unit TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tasks_duration_unit_check'
  ) THEN
    ALTER TABLE tasks
      ADD CONSTRAINT tasks_duration_unit_check
      CHECK (duration_unit IN ('h', 'd', 'w', 'm') OR duration_unit IS NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'duration_with_unit'
  ) THEN
    ALTER TABLE tasks
      ADD CONSTRAINT duration_with_unit
      CHECK (
        (duration IS NULL AND duration_unit IS NULL)
        OR (duration IS NOT NULL AND duration_unit IS NOT NULL AND duration > 0)
      );
  END IF;
END $$;
