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

    test "adds a tag via task detail", %{conn: conn, user: user} do
      {:ok, task} = Tasks.create_task(%{title: "Tag me", user_id: user.id})
      {:ok, lv, _html} = live(conn, ~p"/inbox")
      lv |> element("#task-title-#{task.id}") |> render_click()
      lv |> form("#add-tag-form", %{tag: "urgent"}) |> render_submit()
      assert "urgent" in Tasks.get_task!(task.id, user.id).tags
    end

    test "removes a tag via task detail", %{conn: conn, user: user} do
      {:ok, task} = Tasks.create_task(%{title: "Tag task", user_id: user.id, tags: ["keep", "remove"]})
      {:ok, lv, _html} = live(conn, ~p"/inbox")
      lv |> element("#task-title-#{task.id}") |> render_click()
      lv |> element("button[phx-click='remove_tag'][phx-value-tag='remove']") |> render_click()
      updated_tags = Tasks.get_task!(task.id, user.id).tags
      assert "keep" in updated_tags
      refute "remove" in updated_tags
    end

    test "completes task from detail panel", %{conn: conn, user: user} do
      {:ok, task} = Tasks.create_task(%{title: "Complete from detail", user_id: user.id})
      {:ok, lv, _html} = live(conn, ~p"/inbox")
      lv |> element("#task-title-#{task.id}") |> render_click()
      lv |> element("#task-detail-complete") |> render_click()
      assert Tasks.get_task!(task.id, user.id).status == "completed"
    end

    test "reopens task from detail panel", %{conn: conn, user: user} do
      {:ok, task} = Tasks.create_task(%{title: "Reopen from detail", user_id: user.id})
      {:ok, _} = Tasks.complete_task(task)
      task = Tasks.get_task!(task.id, user.id)
      {:ok, lv, _html} = live(conn, ~p"/inbox")
      lv |> element("#task-title-#{task.id}") |> render_click()
      lv |> element("#task-detail-reopen") |> render_click()
      assert Tasks.get_task!(task.id, user.id).status == "pending"
    end

    test "creates link between tasks", %{conn: conn, user: user} do
      {:ok, t1} = Tasks.create_task(%{title: "Source", user_id: user.id})
      {:ok, t2} = Tasks.create_task(%{title: "Target task", user_id: user.id})
      {:ok, lv, _html} = live(conn, ~p"/inbox")
      lv |> element("#task-title-#{t1.id}") |> render_click()
      lv |> element("#task-detail-add-link") |> render_click()
      lv |> element("#link-search-input") |> render_keyup(%{"query" => "Target"})
      lv |> element("button[phx-click='create_link'][phx-value-to_id='#{t2.id}']") |> render_click()
      links = Kairos.Links.list_links_for(t1.id, "task", user.id)
      assert Enum.any?(links, &(&1.to_id == t2.id))
    end

    test "moves task then back to inbox", %{conn: conn, user: user} do
      {:ok, task} = Tasks.create_task(%{title: "Move around", user_id: user.id})
      {:ok, project} = Projects.create_project(%{name: "Proj", user_id: user.id})
      {:ok, lv, _html} = live(conn, ~p"/inbox")
      lv |> element("#task-title-#{task.id}") |> render_click()
      lv |> element("#task-detail-move-select") |> render_change(%{"container" => "project_#{project.id}"})
      assert Tasks.get_task!(task.id, user.id).project_id == project.id
    end

    test "edits task title in detail", %{conn: conn, user: user} do
      {:ok, task} = Tasks.create_task(%{title: "Old title", user_id: user.id})
      {:ok, lv, _html} = live(conn, ~p"/inbox")
      lv |> element("#task-title-#{task.id}") |> render_click()
      lv |> element("#task-detail-title") |> render_click()
      lv |> form("#task-detail-title-form", %{title: "New title"}) |> render_submit()
      assert Tasks.get_task!(task.id, user.id).title == "New title"
    end

    test "deletes a link from task detail", %{conn: conn, user: user} do
      {:ok, t1} = Tasks.create_task(%{title: "T1", user_id: user.id})
      {:ok, t2} = Tasks.create_task(%{title: "T2", user_id: user.id})
      {:ok, link} = Kairos.Links.create_link(%{from_id: t1.id, from_type: "task", to_id: t2.id, to_type: "task", link_type: "related_to", user_id: user.id})
      {:ok, lv, _html} = live(conn, ~p"/inbox")
      lv |> element("#task-title-#{t1.id}") |> render_click()
      lv |> element("button[phx-click='delete_link'][phx-value-id='#{link.id}']") |> render_click()
      assert Kairos.Links.list_links_for(t1.id, "task", user.id) == []
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
