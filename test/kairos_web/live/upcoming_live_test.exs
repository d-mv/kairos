defmodule KairosWeb.UpcomingLiveTest do
  use KairosWeb.ConnCase, async: true

  import Phoenix.LiveViewTest
  import Kairos.AccountsFixtures

  alias Kairos.Tasks

  setup %{conn: conn} do
    user = user_fixture()
    {:ok, conn: log_in_user(conn, user), user: user}
  end

  test "renders upcoming page", %{conn: conn} do
    {:ok, _lv, html} = live(conn, ~p"/upcoming")
    assert html =~ "Upcoming"
  end

  test "shows future tasks", %{conn: conn, user: user} do
    future = Date.add(Date.utc_today(), 5)
    {:ok, _} = Tasks.create_task(%{title: "Future task", user_id: user.id, due_date: future})
    {:ok, _lv, html} = live(conn, ~p"/upcoming")
    assert html =~ "Future task"
  end

  test "does not show today tasks", %{conn: conn, user: user} do
    {:ok, _} = Tasks.create_task(%{title: "Today task", user_id: user.id, due_date: Date.utc_today()})
    {:ok, _lv, html} = live(conn, ~p"/upcoming")
    refute html =~ "Today task"
  end

  test "does not show tasks without due date", %{conn: conn, user: user} do
    {:ok, _} = Tasks.create_task(%{title: "No date task", user_id: user.id})
    {:ok, _lv, html} = live(conn, ~p"/upcoming")
    refute html =~ "No date task"
  end

  test "does not show other users tasks", %{conn: conn} do
    other = user_fixture()
    future = Date.add(Date.utc_today(), 2)
    {:ok, _} = Tasks.create_task(%{title: "Other upcoming", user_id: other.id, due_date: future})
    {:ok, _lv, html} = live(conn, ~p"/upcoming")
    refute html =~ "Other upcoming"
  end
end
