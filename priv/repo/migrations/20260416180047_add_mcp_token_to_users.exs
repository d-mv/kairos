defmodule Kairos.Repo.Migrations.AddMcpTokenToUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :mcp_token, :string
    end

    create unique_index(:users, [:mcp_token])
  end
end
