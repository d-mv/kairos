defmodule Kairos.Repo.Migrations.AddTagsToTasks do
  use Ecto.Migration

  def change do
    alter table(:tasks) do
      add :tags, {:array, :string}, default: []
    end

    create index(:tasks, [:tags], using: :gin)
  end
end
