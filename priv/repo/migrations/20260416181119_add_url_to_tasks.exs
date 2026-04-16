defmodule Kairos.Repo.Migrations.AddUrlToTasks do
  use Ecto.Migration

  def change do
    alter table(:tasks) do
      add :url, :string
    end
  end
end
