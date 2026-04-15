defmodule Kairos.Repo.Migrations.CreateLinks do
  use Ecto.Migration

  def change do
    create table(:links, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :from_id, :binary_id, null: false
      add :from_type, :string, null: false
      add :to_id, :binary_id, null: false
      add :to_type, :string, null: false
      add :link_type, :string, null: false

      timestamps(type: :utc_datetime)
    end

    create index(:links, [:user_id])
    create index(:links, [:from_id])
    create index(:links, [:to_id])

    # No self-links — enforced at context level and here for safety
    create constraint(:links, :no_self_link,
      check: "from_id != to_id"
    )

    # No duplicate links in same direction
    create unique_index(:links, [:from_id, :to_id, :link_type])
  end
end
