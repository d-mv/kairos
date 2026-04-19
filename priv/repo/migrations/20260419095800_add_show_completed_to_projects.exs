defmodule Kairos.Repo.Migrations.AddShowCompletedToProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :show_completed, :boolean, default: false, null: false
    end
  end
end
