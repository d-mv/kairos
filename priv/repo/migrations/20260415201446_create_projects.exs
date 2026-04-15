defmodule Kairos.Repo.Migrations.CreateProjects do
  use Ecto.Migration

  def change do
    create table(:projects, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :area_id, references(:areas, type: :binary_id, on_delete: :nilify_all)
      add :name, :string, null: false
      add :status, :string, null: false, default: "active"
      add :position, :integer, null: false, default: 0

      timestamps(type: :utc_datetime)
    end

    create index(:projects, [:user_id])
    create index(:projects, [:area_id])
  end
end
