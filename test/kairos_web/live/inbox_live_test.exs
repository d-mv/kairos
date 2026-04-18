defmodule KairosWeb.InboxLiveTest do
  use KairosWeb.ConnCase, async: true

  import Phoenix.LiveViewTest
  import Kairos.AccountsFixtures

  alias Kairos.{Tasks, Projects, Areas}

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    {:ok, conn: conn, user: user}
  end

  describe "task list" do
    test "renders inbox tasks", %{conn: conn, user: user} do
      {:ok, _} = Tasks.create_task(%{title: "My inbox task", user_id: user.id})
      {:ok, _lv, html} = live(conn, ~p"/inbox")
      assert html =~ "My inbox task"
    end

    test "does not show other users tasks", %{conn: conn} do
      other = user_fixture()
      {:ok, _} = Tasks.create_task(%{title: "Other task", user_id: other.id})
      {:ok, _lv, html} = live(conn, ~p"/inbox")
      refute html =~ "Other task"
    end

    test "creates a task", %{conn: conn, user: user} do
      {:ok, lv, _html} = live(conn, ~p"/inbox")
      lv |> form("#inbox-add-form", %{title: "New task"}) |> render_submit()
      assert Tasks.list_inbox(user.id) |> Enum.any?(&(&1.title == "New task"))
    end

    test "completes a task via checkbox", %{conn: conn, user: user} do
      {:ok, task} = Tasks.create_task(%{title: "Complete me", user_id: user.id})
      {:ok, lv, _html} = live(conn, ~p"/inbox")
      lv |> element("#task-checkbox-#{task.id}") |> render_click()
      assert Tasks.get_task!(task.id, user.id).status == "completed"
    end

    test "reopens a completed task via checkbox", %{conn: conn, user: user} do
      {:ok, task} = Tasks.create_task(%{title: "Reopen me", user_id: user.id})
      {:ok, _} = Tasks.complete_task(task)
      {:ok, lv, _html} = live(conn, ~p"/inbox")
      lv |> element("#task-checkbox-#{task.id}") |> render_click()
      assert Tasks.get_task!(task.id, user.id).status == "pending"
    end

    test "deletes a task", %{conn: conn, user: user} do
      {:ok, task} = Tasks.create_task(%{title: "Delete me", user_id: user.id})
      {:ok, lv, _html} = live(conn, ~p"/inbox")
      lv |> element("#task-delete-#{task.id}") |> render_click()
      assert Tasks.list_inbox(user.id) |> Enum.all?(&(&1.id != task.id))
    end

    test "shows priority dot when priority is set", %{conn: conn, user: user} do
      {:ok, task} = Tasks.create_task(%{title: "High priority", user_id: user.id, priority: "high"})
      {:ok, _lv, html} = live(conn, ~p"/inbox")
      assert html =~ "task-priority-#{task.id}"
    end
  end

  describe "task detail" do
    test "opens task detail on click", %{conn: conn, user: user} do
      {:ok, task} = Tasks.create_task(%{title: "Detail task", user_id: user.id})
      {:ok, lv, _html} = live(conn, ~p"/inbox")
      html = lv |> element("#task-title-#{task.id}") |> render_click()
      assert html =~ "task-detail"
    end

    test "saves priority via task detail", %{conn: conn, user: user} do
      {:ok, task} = Tasks.create_task(%{title: "Prio task", user_id: user.id})
      {:ok, lv, _html} = live(conn, ~p"/inbox")
      lv |> element("#task-title-#{task.id}") |> render_click()
      lv |> element("#task-detail-priority") |> render_change(%{"value" => "high", "field" => "priority"})
      assert Tasks.get_task!(task.id, user.id).priority == "high"
    end

    test "saves notes via task detail", %{conn: conn, user: user} do
      {:ok, task} = Tasks.create_task(%{title: "Notes task", user_id: user.id})
      {:ok, lv, _html} = live(conn, ~p"/inbox")
      lv |> element("#task-title-#{task.id}") |> render_click()
      lv |> element("#task-detail-notes") |> render_change(%{"value" => "my note", "field" => "notes"})
      assert Tasks.get_task!(task.id, user.id).notes == "my note"
    end

    test "moves task to project", %{conn: conn, user: user} do
      {:ok, task} = Tasks.create_task(%{title: "Move me", user_id: user.id})
      {:ok, project} = Projects.create_project(%{name: "P1", user_id: user.id})
      {:ok, lv, _html} = live(conn, ~p"/inbox")
      lv |> element("#task-title-#{task.id}") |> render_click()
      lv |> element("#task-detail-move-select") |> render_change(%{"container" => "project_#{project.id}"})
      updated = Tasks.get_task!(task.id, user.id)
      assert updated.project_id == project.id
      assert is_nil(updated.area_id)
    end

    test "moves task to area", %{conn: conn, user: user} do
      {:ok, task} = Tasks.create_task(%{title: "Move to area", user_id: user.id})
      {:ok, area} = Areas.create_area(%{name: "A1", user_id: user.id})
      {:ok, lv, _html} = live(conn, ~p"/inbox")
      lv |> element("#task-title-#{task.id}") |> render_click()
      lv |> element("#task-detail-move-select") |> render_change(%{"container" => "area_#{area.id}"})
      updated = Tasks.get_task!(task.id, user.id)
      assert updated.area_id == area.id
      assert is_nil(updated.project_id)
    end

    test "link search returns results", %{conn: conn, user: user} do
      {:ok, t1} = Tasks.create_task(%{title: "Alpha task", user_id: user.id})
      {:ok, _t2} = Tasks.create_task(%{title: "Beta task", user_id: user.id})
      {:ok, lv, _html} = live(conn, ~p"/inbox")
      lv |> element("#task-title-#{t1.id}") |> render_click()
      lv |> element("#task-detail-add-link") |> render_click()
      lv |> element("#link-search-input") |> render_keyup(%{"query" => "Beta"})
      assert has_element?(lv, "#link-search-results", "Beta task")
      refute has_element?(lv, "#link-search-results", "Alpha task")
    end

    test "link search includes projects", %{conn: conn, user: user} do
      {:ok, task} = Tasks.create_task(%{title: "Task X", user_id: user.id})
      {:ok, _project} = Projects.create_project(%{name: "My Project", user_id: user.id})
      {:ok, lv, _html} = live(conn, ~p"/inbox")
      lv |> element("#task-title-#{task.id}") |> render_click()
      lv |> element("#task-detail-add-link") |> render_click()
      html = lv |> element("#link-search-input") |> render_keyup(%{"query" => "My"})
      assert html =~ "My Project"
    end

    test "closes task detail", %{conn: conn, user: user} do
      {:ok, task} = Tasks.create_task(%{title: "Close me", user_id: user.id})
      {:ok, lv, _html} = live(conn, ~p"/inbox")
      lv |> element("#task-title-#{task.id}") |> render_click()
      lv |> element("#task-detail-close") |> render_click()
      refute has_element?(lv, "#task-detail-header")
    end
  end
end
