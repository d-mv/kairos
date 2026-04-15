defmodule Kairos.Repo.Migrations.CreateTasks do
  use Ecto.Migration

  def change do
    create table(:tasks, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :project_id, references(:projects, type: :binary_id, on_delete: :nilify_all)
      add :area_id, references(:areas, type: :binary_id, on_delete: :nilify_all)
      add :parent_id, references(:tasks, type: :binary_id, on_delete: :delete_all)
      add :title, :string, null: false
      add :notes, :text
      add :status, :string, null: false, default: "pending"
      add :due_date, :date
      add :due_time, :time
      add :position, :integer, null: false, default: 0

      timestamps(type: :utc_datetime)
    end

    create index(:tasks, [:user_id])
    create index(:tasks, [:project_id])
    create index(:tasks, [:area_id])
    create index(:tasks, [:parent_id])
    # max depth 1 enforced at context level (Tasks.create_task/1)
  end
end
