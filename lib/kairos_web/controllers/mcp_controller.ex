defmodule KairosWeb.MCPController do
  use KairosWeb, :controller

  def protected_resource(conn, _params) do
    base_url = KairosWeb.Endpoint.url()
    json(conn, %{
      "resource" => base_url,
      "authorization_servers" => [base_url]
    })
  end

  def authorization_server(conn, _params) do
    base_url = KairosWeb.Endpoint.url()
    json(conn, %{
      "issuer" => base_url,
      "authorization_endpoint" => "#{base_url}/oauth/authorize",
      "token_endpoint" => "#{base_url}/oauth/token",
      "registration_endpoint" => "#{base_url}/register",
      "grant_types_supported" => ["client_credentials"],
      "response_types_supported" => ["code"],
      "token_endpoint_auth_methods_supported" => ["none"]
    })
  end

  def register(conn, params) do
    json(conn, %{
      "client_id" => "kairos-mcp-client",
      "client_secret" => nil,
      "redirect_uris" => params["redirect_uris"] || []
    })
  end

  def token(conn, _params) do
    case get_req_header(conn, "authorization") do
      ["Bearer " <> token] ->
        json(conn, %{
          "access_token" => token,
          "token_type" => "Bearer",
          "expires_in" => 3600
        })

      _ ->
        conn
        |> put_status(401)
        |> json(%{error: "invalid_client"})
    end
  end

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
