defmodule Kairos.Repo do
  use Ecto.Repo,
    otp_app: :kairos,
    adapter: Ecto.Adapters.Postgres

  import Ecto.Query

  def scope(queryable, user_id) do
    from q in queryable, where: q.user_id == ^user_id
  end
end
