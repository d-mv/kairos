defmodule KairosWeb.GanttLiveTest do
  use KairosWeb.ConnCase, async: true

  import Phoenix.LiveViewTest
  import Kairos.AccountsFixtures

  alias Kairos.Tasks

  setup %{conn: conn} do
    user = user_fixture()
    {:ok, conn: log_in_user(conn, user), user: user}
  end

  test "renders gantt page", %{conn: conn} do
    {:ok, _lv, html} = live(conn, ~p"/gantt")
    assert html =~ "Gantt"
  end

  test "shows tasks in gantt data", %{conn: conn, user: user} do
    {:ok, _} = Tasks.create_task(%{title: "Gantt task", user_id: user.id})
    {:ok, _lv, html} = live(conn, ~p"/gantt")
    assert html =~ "Gantt task"
  end

  test "updates task due date via drag event", %{conn: conn, user: user} do
    {:ok, task} = Tasks.create_task(%{title: "Draggable", user_id: user.id})
    {:ok, lv, _html} = live(conn, ~p"/gantt")
    lv |> render_hook("task_date_changed", %{"id" => task.id, "end" => "2026-12-31"})
    updated = Tasks.get_task!(task.id, user.id)
    assert updated.due_date == ~D[2026-12-31]
  end

  test "ignores drag event for unknown task", %{conn: conn} do
    {:ok, lv, _html} = live(conn, ~p"/gantt")
    assert lv |> render_hook("task_date_changed", %{"id" => "00000000-0000-0000-0000-000000000000", "end" => "2026-12-31"})
  end

  test "ignores drag event with invalid date", %{conn: conn, user: user} do
    {:ok, task} = Tasks.create_task(%{title: "Bad date", user_id: user.id})
    {:ok, lv, _html} = live(conn, ~p"/gantt")
    assert lv |> render_hook("task_date_changed", %{"id" => task.id, "end" => "not-a-date"})
  end

  test "does not show other users tasks", %{conn: conn} do
    other = user_fixture()
    {:ok, _} = Tasks.create_task(%{title: "Other gantt", user_id: other.id})
    {:ok, _lv, html} = live(conn, ~p"/gantt")
    refute html =~ "Other gantt"
  end
end
