defmodule KairosWeb.MCP.AuthPlugTest do
  use KairosWeb.ConnCase, async: true

  alias Kairos.Accounts
  alias Kairos.MCP.AuthPlug

  import Kairos.AccountsFixtures
  import Plug.Conn

  describe "MCP AuthPlug" do
    test "rejects request with no authorization header", %{conn: conn} do
      conn = AuthPlug.call(conn, AuthPlug.init([]))
      assert conn.halted
      assert conn.status == 401
    end

    test "rejects request with unknown token", %{conn: conn} do
      conn =
        conn
        |> put_req_header("authorization", "Bearer unknown-token")
        |> AuthPlug.call(AuthPlug.init([]))

      assert conn.halted
      assert conn.status == 401
    end

    test "allows request with valid token and assigns user_id", %{conn: conn} do
      user = user_fixture()
      {:ok, {_token, raw_token}} = Accounts.create_mcp_token(user.id, "Test Token")

      conn =
        conn
        |> put_req_header("authorization", "Bearer #{raw_token}")
        |> AuthPlug.call(AuthPlug.init([]))

      refute conn.halted
      assert conn.assigns[:user_id] == user.id
    end

    test "rejects request with malformed authorization header", %{conn: conn} do
      conn =
        conn
        |> put_req_header("authorization", "Basic somebase64stuff")
        |> AuthPlug.call(AuthPlug.init([]))

      assert conn.halted
      assert conn.status == 401
    end
  end
end
