defmodule Kairos.Accounts.McpToken do
  use Ecto.Schema
  import Ecto.Changeset

  schema "mcp_tokens" do
    field :name, :string
    field :token_hash, :string
    field :user_id, :integer # matches users.id bigint

    timestamps(type: :utc_datetime)
  end

  @doc """
  A changeset for creating an MCP token.
  """
  def changeset(mcp_token, attrs) do
    mcp_token
    |> cast(attrs, [:name, :token_hash, :user_id])
    |> validate_required([:name, :token_hash, :user_id])
    |> unique_constraint(:token_hash)
  end
end
