defmodule Kairos.Repo.Migrations.CreateMcpTokens do
  use Ecto.Migration

  def change do
    create table(:mcp_tokens) do
      add :name, :string, null: false
      add :token_hash, :string, null: false
      add :user_id, references(:users, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:mcp_tokens, [:user_id])
    create unique_index(:mcp_tokens, [:token_hash])

    alter table(:users) do
      remove :mcp_token
    end
  end
end
