defmodule KairosWeb.MCPController do
  use KairosWeb, :controller

  def well_known_not_found(conn, _params) do
    conn
    |> put_status(404)
    |> json(%{error: "not_found"})
  end

  def method_not_allowed(conn, _params) do
    conn
    |> put_status(405)
    |> json(%{jsonrpc: "2.0", error: %{code: -32000, message: "Method not allowed."}, id: nil})
  end
end
