defmodule Kairos.Repo.Migrations.AddSearchVectorToTasks do
  use Ecto.Migration

  def up do
    execute """
    ALTER TABLE tasks ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english', coalesce(title, '') || ' ' || coalesce(notes, ''))
    ) STORED
    """

    execute "CREATE INDEX tasks_search_vector_gin ON tasks USING gin(search_vector)"
  end

  def down do
    execute "DROP INDEX IF EXISTS tasks_search_vector_gin"
    execute "ALTER TABLE tasks DROP COLUMN IF EXISTS search_vector"
  end
end
