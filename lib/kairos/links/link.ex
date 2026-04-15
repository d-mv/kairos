defmodule Kairos.Links.Link do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @link_types ~w(blocks blocked_by related_to)
  @entity_types ~w(task project area)

  schema "links" do
    field :from_id, :binary_id
    field :from_type, :string
    field :to_id, :binary_id
    field :to_type, :string
    field :link_type, :string
    field :user_id, :integer

    timestamps(type: :utc_datetime)
  end

  def changeset(link, attrs) do
    link
    |> cast(attrs, [:from_id, :from_type, :to_id, :to_type, :link_type, :user_id])
    |> validate_required([:from_id, :from_type, :to_id, :to_type, :link_type, :user_id])
    |> validate_inclusion(:link_type, @link_types)
    |> validate_inclusion(:from_type, @entity_types)
    |> validate_inclusion(:to_type, @entity_types)
    |> validate_no_self_link()
  end

  defp validate_no_self_link(changeset) do
    from_id = get_field(changeset, :from_id)
    to_id = get_field(changeset, :to_id)

    if from_id && to_id && from_id == to_id do
      add_error(changeset, :to_id, "cannot link an entity to itself")
    else
      changeset
    end
  end

  def inverse_type("blocks"), do: "blocked_by"
  def inverse_type("blocked_by"), do: "blocks"
  def inverse_type("related_to"), do: "related_to"
end
