defmodule KairosWeb.PageControllerTest do
  use KairosWeb.ConnCase

  test "GET / redirects to inbox", %{conn: conn} do
    conn = get(conn, ~p"/")
    assert redirected_to(conn) == ~p"/inbox"
  end
end
