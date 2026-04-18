defmodule KairosWeb.TodayLiveTest do
  use KairosWeb.ConnCase, async: true

  import Phoenix.LiveViewTest
  import Kairos.AccountsFixtures

  alias Kairos.Tasks

  setup %{conn: conn} do
    user = user_fixture()
    {:ok, conn: log_in_user(conn, user), user: user}
  end

  test "renders today page", %{conn: conn} do
    {:ok, _lv, html} = live(conn, ~p"/today")
    assert html =~ "Today"
  end

  test "shows tasks due today", %{conn: conn, user: user} do
    today = Date.utc_today()
    {:ok, _} = Tasks.create_task(%{title: "Today task", user_id: user.id, due_date: today})
    {:ok, _lv, html} = live(conn, ~p"/today")
    assert html =~ "Today task"
  end

  test "does not show tasks due in future", %{conn: conn, user: user} do
    future = Date.add(Date.utc_today(), 3)
    {:ok, _} = Tasks.create_task(%{title: "Future task", user_id: user.id, due_date: future})
    {:ok, _lv, html} = live(conn, ~p"/today")
    refute html =~ "Future task"
  end

  test "completes a task", %{conn: conn, user: user} do
    today = Date.utc_today()
    {:ok, task} = Tasks.create_task(%{title: "Complete today", user_id: user.id, due_date: today})
    {:ok, lv, _html} = live(conn, ~p"/today")
    lv |> element("#task-checkbox-#{task.id}") |> render_click()
    assert Tasks.get_task!(task.id, user.id).status == "completed"
  end

  test "completing a task removes it from today view", %{conn: conn, user: user} do
    today = Date.utc_today()
    {:ok, task} = Tasks.create_task(%{title: "Remove me", user_id: user.id, due_date: today})
    {:ok, lv, _html} = live(conn, ~p"/today")
    lv |> element("#task-checkbox-#{task.id}") |> render_click()
    refute has_element?(lv, "#task-#{task.id}")
  end

  test "reopen_task handler (via direct event)", %{conn: conn, user: user} do
    today = Date.utc_today()
    {:ok, task} = Tasks.create_task(%{title: "Reopen via hook", user_id: user.id, due_date: today})
    {:ok, _} = Tasks.complete_task(task)
    {:ok, lv, _html} = live(conn, ~p"/today")
    lv |> render_hook("reopen_task", %{"id" => task.id})
    assert Tasks.get_task!(task.id, user.id).status == "pending"
  end

  test "does not show other users tasks", %{conn: conn} do
    other = user_fixture()
    today = Date.utc_today()
    {:ok, _} = Tasks.create_task(%{title: "Other today", user_id: other.id, due_date: today})
    {:ok, _lv, html} = live(conn, ~p"/today")
    refute html =~ "Other today"
  end
end
