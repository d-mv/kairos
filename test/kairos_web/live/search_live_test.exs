defmodule KairosWeb.SearchLiveTest do
  use KairosWeb.ConnCase, async: true

  import Phoenix.LiveViewTest
  import Kairos.AccountsFixtures

  alias Kairos.Tasks

  setup %{conn: conn} do
    user = user_fixture()
    {:ok, conn: log_in_user(conn, user), user: user}
  end

  test "renders search page", %{conn: conn} do
    {:ok, _lv, html} = live(conn, ~p"/search")
    assert html =~ "Search"
  end

  test "shows no results before typing", %{conn: conn, user: user} do
    {:ok, _} = Tasks.create_task(%{title: "Find me", user_id: user.id})
    {:ok, _lv, html} = live(conn, ~p"/search")
    refute html =~ "search-results"
  end

  test "finds task by title", %{conn: conn, user: user} do
    {:ok, _} = Tasks.create_task(%{title: "Searchable task", user_id: user.id})
    {:ok, lv, _html} = live(conn, ~p"/search")
    html = lv |> form("#search-form", %{query: "Searchable"}) |> render_change()
    assert html =~ "Searchable task"
  end

  test "no results for short query (< 2 chars)", %{conn: conn, user: user} do
    {:ok, _} = Tasks.create_task(%{title: "Short query task", user_id: user.id})
    {:ok, lv, _html} = live(conn, ~p"/search")
    html = lv |> form("#search-form", %{query: "S"}) |> render_change()
    refute html =~ "search-results"
  end

  test "shows empty state for no matches", %{conn: conn} do
    {:ok, lv, _html} = live(conn, ~p"/search")
    html = lv |> form("#search-form", %{query: "xyznotfound"}) |> render_change()
    assert html =~ "No results for"
  end

  test "does not return other users tasks", %{conn: conn} do
    other = user_fixture()
    {:ok, _} = Tasks.create_task(%{title: "OtherSearchTask", user_id: other.id})
    {:ok, lv, _html} = live(conn, ~p"/search")
    html = lv |> form("#search-form", %{query: "OtherSearch"}) |> render_change()
    refute html =~ "OtherSearchTask"
  end
end
