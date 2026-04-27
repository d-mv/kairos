alias Kairos.Accounts
alias Kairos.Accounts.User
alias Kairos.Repo

# Create a default user if none exists
user = 
  case Repo.get_by(User, email: "admin@example.com") do
    nil ->
      {:ok, user} = Accounts.register_user(%{
        email: "admin@example.com",
        password: "password123456"
      })
      user
    user -> user
  end

# Create the MCP token from kairos.id
token = "f9e0aee3-7fa1-4193-8aef-b03d8ea9fc54"
token_hash = :crypto.hash(:sha256, token) |> Base.encode16(case: :lower)

case Repo.get_by(Kairos.Accounts.McpToken, token_hash: token_hash) do
  nil ->
    %Kairos.Accounts.McpToken{}
    |> Kairos.Accounts.McpToken.changeset(%{
      user_id: user.id,
      name: "Default MCP Token",
      token_hash: token_hash
    })
    |> Repo.insert!()
    IO.puts("Created MCP token for admin@example.com")
  _ ->
    IO.puts("MCP token already exists")
end
