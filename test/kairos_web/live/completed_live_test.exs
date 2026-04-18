defmodule KairosWeb.CompletedLiveTest do
  use KairosWeb.ConnCase, async: true

  import Phoenix.LiveViewTest
  import Kairos.AccountsFixtures

  alias Kairos.Tasks

  setup %{conn: conn} do
    user = user_fixture()
    {:ok, conn: log_in_user(conn, user), user: user}
  end

  test "renders completed page", %{conn: conn} do
    {:ok, _lv, html} = live(conn, ~p"/completed")
    assert html =~ "Completed"
  end

  test "shows completed tasks", %{conn: conn, user: user} do
    {:ok, task} = Tasks.create_task(%{title: "Done task", user_id: user.id})
    Tasks.complete_task(task)
    {:ok, _lv, html} = live(conn, ~p"/completed")
    assert html =~ "Done task"
  end

  test "does not show pending tasks", %{conn: conn, user: user} do
    {:ok, _} = Tasks.create_task(%{title: "Pending task", user_id: user.id})
    {:ok, _lv, html} = live(conn, ~p"/completed")
    refute html =~ "Pending task"
  end

  test "reopens a completed task", %{conn: conn, user: user} do
    {:ok, task} = Tasks.create_task(%{title: "Reopen me", user_id: user.id})
    {:ok, _} = Tasks.complete_task(task)
    {:ok, lv, _html} = live(conn, ~p"/completed")
    lv |> element("#task-checkbox-#{task.id}") |> render_click()
    assert Tasks.get_task!(task.id, user.id).status == "pending"
  end

  test "does not show other users completed tasks", %{conn: conn} do
    other = user_fixture()
    {:ok, task} = Tasks.create_task(%{title: "Other done", user_id: other.id})
    Tasks.complete_task(task)
    {:ok, _lv, html} = live(conn, ~p"/completed")
    refute html =~ "Other done"
  end

  test "shows empty state", %{conn: conn} do
    {:ok, _lv, html} = live(conn, ~p"/completed")
    assert html =~ "Nothing completed yet"
  end
end
