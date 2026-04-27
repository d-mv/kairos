defmodule KairosWeb.MCPControllerTest do
  use KairosWeb.ConnCase, async: true

  alias Kairos.Accounts
  import Kairos.AccountsFixtures

  describe "discovery endpoints" do
    test "GET /.well-known/oauth-protected-resource", %{conn: conn} do
      conn = get(conn, "/.well-known/oauth-protected-resource")
      json = json_response(conn, 200)

      base_url = "http://www.example.com:80"
      assert json["resource"] == base_url
      assert json["authorization_servers"] == [base_url]
    end

    test "GET /.well-known/oauth-authorization-server", %{conn: conn} do
      conn = get(conn, "/.well-known/oauth-authorization-server")
      json = json_response(conn, 200)

      base_url = "http://www.example.com:80"
      assert json["issuer"] == base_url
      assert json["authorization_endpoint"] == "#{base_url}/oauth/authorize"
      assert json["token_endpoint"] == "#{base_url}/oauth/token"
      assert json["registration_endpoint"] == "#{base_url}/register"
    end
  end

  describe "registration" do
    test "POST /register", %{conn: conn} do
      conn = post(conn, "/register", %{redirect_uris: ["http://localhost:3000/callback"]})
      json = json_response(conn, 200)

      assert json["client_id"] == "kairos-mcp-client"
      assert json["redirect_uris"] == ["http://localhost:3000/callback"]
    end
  end

  describe "token exchange" do
    setup %{conn: conn} do
      user = user_fixture()
      {:ok, {_token, raw_token}} = Accounts.create_mcp_token(user.id, "Test Token")
      {:ok, conn: conn, user: user, raw_token: raw_token}
    end

    test "POST /oauth/token returns the same bearer token as access_token", %{conn: conn, raw_token: raw_token} do
      conn =
        conn
        |> put_req_header("authorization", "Bearer #{raw_token}")
        |> post("/oauth/token", %{grant_type: "client_credentials"})

      json = json_response(conn, 200)
      assert json["access_token"] == raw_token
      assert json["token_type"] == "Bearer"
    end

    test "POST /oauth/token fails without auth", %{conn: conn} do
      conn = post(conn, "/oauth/token", %{grant_type: "client_credentials"})
      assert json_response(conn, 401)
    end
  end
end
