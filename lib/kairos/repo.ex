defmodule Kairos.Repo do
  use Ecto.Repo,
    otp_app: :kairos,
    adapter: Ecto.Adapters.Postgres
end
