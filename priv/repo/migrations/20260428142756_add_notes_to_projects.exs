defmodule Kairos.Repo.Migrations.AddNotesToProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :notes, :text
    end
  end
end
