defmodule Kairos.Repo.Migrations.CreateAreas do
  use Ecto.Migration

  def change do
    create table(:areas, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :name, :string, null: false
      add :color, :string

      timestamps(type: :utc_datetime)
    end

    create index(:areas, [:user_id])
  end
end
