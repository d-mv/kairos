defmodule Kairos.Tasks.Task do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @statuses ~w(pending completed)
  @priorities ~w(none low medium high)

  schema "tasks" do
    field :title, :string
    field :notes, :string
    field :status, :string, default: "pending"
    field :priority, :string, default: "none"
    field :due_date, :date
    field :due_time, :time
    field :position, :integer, default: 0
    field :url, :string
    field :tags, {:array, :string}, default: []
    field :user_id, :integer

    belongs_to :project, Kairos.Projects.Project
    belongs_to :area, Kairos.Areas.Area
    belongs_to :parent, Kairos.Tasks.Task, foreign_key: :parent_id
    has_many :subtasks, Kairos.Tasks.Task, foreign_key: :parent_id

    timestamps(type: :utc_datetime)
  end

  def changeset(task, attrs) do
    task
    |> cast(attrs, [:title, :notes, :status, :priority, :due_date, :due_time, :position, :url, :tags, :user_id, :project_id, :area_id, :parent_id])
    |> validate_required([:title, :user_id])
    |> validate_length(:title, min: 1, max: 500)
    |> validate_inclusion(:status, @statuses)
    |> validate_inclusion(:priority, @priorities)
    |> validate_single_container()
  end

  defp validate_single_container(changeset) do
    project_id = get_field(changeset, :project_id)
    area_id = get_field(changeset, :area_id)
    parent_id = get_field(changeset, :parent_id)

    containers = Enum.count([project_id, area_id, parent_id], &(&1 != nil))

    if containers > 1 do
      add_error(changeset, :base, "task must belong to exactly one container")
    else
      changeset
    end
  end
end
