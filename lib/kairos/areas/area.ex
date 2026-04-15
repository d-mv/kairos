defmodule Kairos.Areas.Area do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "areas" do
    field :name, :string
    field :color, :string
    field :user_id, :integer

    has_many :projects, Kairos.Projects.Project
    has_many :tasks, Kairos.Tasks.Task

    timestamps(type: :utc_datetime)
  end

  def changeset(area, attrs) do
    area
    |> cast(attrs, [:name, :color, :user_id])
    |> validate_required([:name, :user_id])
    |> validate_length(:name, min: 1, max: 255)
  end
end
