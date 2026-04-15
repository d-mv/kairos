defmodule Kairos.MCP.AuthPlug do
  @moduledoc """
  Checks the Bearer token on MCP requests.
  Returns 401 if missing or invalid.
  """

  @behaviour Plug

  import Plug.Conn

  @impl Plug
  def init(opts), do: opts

  @impl Plug
  def call(conn, _opts) do
    expected = Application.get_env(:kairos, :mcp_api_token)

    case get_req_header(conn, "authorization") do
      ["Bearer " <> token] when token == expected and not is_nil(expected) ->
        conn

      _ ->
        conn
        |> put_resp_content_type("application/json")
        |> send_resp(401, ~s({"error":"unauthorized"}))
        |> halt()
    end
  end
end
