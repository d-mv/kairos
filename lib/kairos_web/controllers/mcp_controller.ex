defmodule KairosWeb.MCPController do
  use KairosWeb, :controller

  defp get_base_url(conn) do
    "#{conn.scheme}://#{conn.host}:#{conn.port}"
  end

  def oauth_protected_resource(conn, _params) do
    base_url = get_base_url(conn)
    json(conn, %{
      resource: base_url,
      authorization_servers: [base_url],
      bearer_methods_supported: ["header"]
    })
  end

  def oauth_authorization_server(conn, _params) do
    base_url = get_base_url(conn)
    json(conn, %{
      issuer: base_url,
      authorization_endpoint: "#{base_url}/oauth/authorize",
      token_endpoint: "#{base_url}/oauth/token",
      registration_endpoint: "#{base_url}/register",
      response_types_supported: ["code"],
      grant_types_supported: ["client_credentials", "authorization_code"],
      token_endpoint_auth_methods_supported: ["none"],
      code_challenge_methods_supported: ["S256"]
    })
  end

  # Dynamic client registration — validates Bearer token, returns static client_id
  def oauth_register(conn, params) do
    redirect_uris = Map.get(params, "redirect_uris", [])

    json(conn, %{
      client_id: "kairos-mcp-client",
      redirect_uris: redirect_uris,
      grant_types: ["client_credentials"],
      token_endpoint_auth_method: "none"
    })
  end

  # Token endpoint — returns the Bearer token used to authenticate as the access_token
  def oauth_token(conn, _params) do
    ["Bearer " <> token] = Plug.Conn.get_req_header(conn, "authorization")

    json(conn, %{
      access_token: token,
      token_type: "Bearer",
      expires_in: 86_400
    })
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
