defmodule Kairos.MCP.AuthPlug do
  @moduledoc """
  Validates the Bearer token on MCP requests by looking up the user that owns
  the token. Assigns `user_id` in conn.assigns on success, halts with 401
  otherwise.
  """

  @behaviour Plug

  import Plug.Conn

  alias Kairos.Accounts

  @impl Plug
  def init(opts), do: opts

  @impl Plug
  def call(conn, _opts) do
    with ["Bearer " <> token] <- get_req_header(conn, "authorization"),
         %{id: user_id} <- Accounts.get_user_by_mcp_token(token) do
      conn
      |> put_req_header("accept", "application/json, text/event-stream")
      |> assign(:user_id, user_id)
    else
      _ ->
        conn
        |> put_resp_header("www-authenticate", "Bearer")
        |> put_resp_content_type("application/json")
        |> send_resp(401, ~s({"error":"invalid_token","error_description":"Unauthorized"}))
        |> halt()
    end
  end
end
