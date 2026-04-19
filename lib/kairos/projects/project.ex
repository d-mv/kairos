defmodule Kairos.Projects.Project do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @statuses ~w(active completed archived)

  schema "projects" do
    field :name, :string
    field :status, :string, default: "active"
    field :position, :integer, default: 0
    field :show_completed, :boolean, default: false
    field :user_id, :integer

    belongs_to :area, Kairos.Areas.Area
    has_many :tasks, Kairos.Tasks.Task

    timestamps(type: :utc_datetime)
  end

  def changeset(project, attrs) do
    project
    |> cast(attrs, [:name, :status, :position, :show_completed, :area_id, :user_id])
    |> validate_required([:name, :user_id])
    |> validate_length(:name, min: 1, max: 255)
    |> validate_inclusion(:status, @statuses)
  end
end
