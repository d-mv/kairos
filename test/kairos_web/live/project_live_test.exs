defmodule KairosWeb.ProjectLiveTest do
  use KairosWeb.ConnCase, async: true

  import Phoenix.LiveViewTest
  import Kairos.AccountsFixtures

  alias Kairos.{Tasks, Projects}

  setup %{conn: conn} do
    user = user_fixture()
    {:ok, project} = Projects.create_project(%{name: "My Project", user_id: user.id})
    {:ok, conn: log_in_user(conn, user), user: user, project: project}
  end

  test "renders project page", %{conn: conn, project: project} do
    {:ok, _lv, html} = live(conn, ~p"/projects/#{project.id}")
    assert html =~ "My Project"
  end

  test "shows project tasks", %{conn: conn, user: user, project: project} do
    {:ok, _} = Tasks.create_task(%{title: "Project task", user_id: user.id, project_id: project.id})
    {:ok, _lv, html} = live(conn, ~p"/projects/#{project.id}")
    assert html =~ "Project task"
  end

  test "creates a task in project", %{conn: conn, user: user, project: project} do
    {:ok, lv, _html} = live(conn, ~p"/projects/#{project.id}")
    lv |> form("#project-add-form", %{title: "New project task"}) |> render_submit()
    tasks = Tasks.list_for_project(project.id, user.id)
    assert Enum.any?(tasks, &(&1.title == "New project task"))
  end

  test "completes a task", %{conn: conn, user: user, project: project} do
    {:ok, task} = Tasks.create_task(%{title: "Complete me", user_id: user.id, project_id: project.id})
    {:ok, lv, _html} = live(conn, ~p"/projects/#{project.id}")
    lv |> element("#task-checkbox-#{task.id}") |> render_click()
    assert Tasks.get_task!(task.id, user.id).status == "completed"
  end

  test "reopens a completed task", %{conn: conn, user: user, project: project} do
    {:ok, task} = Tasks.create_task(%{title: "Reopen", user_id: user.id, project_id: project.id})
    {:ok, _} = Tasks.complete_task(task)
    {:ok, lv, _html} = live(conn, ~p"/projects/#{project.id}")
    lv |> element("#task-checkbox-#{task.id}") |> render_click()
    assert Tasks.get_task!(task.id, user.id).status == "pending"
  end

  test "renames project", %{conn: conn, user: user, project: project} do
    {:ok, lv, _html} = live(conn, ~p"/projects/#{project.id}")
    lv |> element("#project-menu-btn") |> render_click()
    lv |> element("button", "Rename") |> render_click()
    lv |> form("#project-rename-form", %{name: "Renamed Project"}) |> render_submit()
    assert Projects.get_project!(project.id, user.id).name == "Renamed Project"
  end

  test "deletes project", %{conn: conn, user: user, project: project} do
    {:ok, lv, _html} = live(conn, ~p"/projects/#{project.id}")
    lv |> element("#project-menu-btn") |> render_click()
    lv |> element("button", "Delete") |> render_click()
    lv |> element("button", "Delete project") |> render_click()
    assert_redirect(lv, ~p"/")
    assert Projects.get_project(project.id, user.id) == nil
  end

  test "demotes project to task", %{conn: conn, user: user, project: project} do
    {:ok, lv, _html} = live(conn, ~p"/projects/#{project.id}")
    lv |> element("#project-menu-btn") |> render_click()
    lv |> element("button", "Demote to task") |> render_click()
    lv |> element("button", "Convert to task") |> render_click()
    assert_redirect(lv, ~p"/inbox")
    assert Projects.get_project(project.id, user.id) == nil
  end

  test "cancel rename", %{conn: conn, project: project} do
    {:ok, lv, _html} = live(conn, ~p"/projects/#{project.id}")
    lv |> element("#project-menu-btn") |> render_click()
    lv |> element("button", "Rename") |> render_click()
    assert has_element?(lv, "#project-rename-form")
    lv |> render_hook("cancel_rename", %{})
    refute has_element?(lv, "#project-rename-form")
  end

  test "reopen_task handler via render_hook", %{conn: conn, user: user, project: project} do
    {:ok, task} = Tasks.create_task(%{title: "Hook reopen", user_id: user.id, project_id: project.id})
    {:ok, _} = Tasks.complete_task(task)
    {:ok, lv, _html} = live(conn, ~p"/projects/#{project.id}")
    lv |> render_hook("reopen_task", %{"id" => task.id})
    assert Tasks.get_task!(task.id, user.id).status == "pending"
  end

  test "redirects if project not owned by user", %{conn: conn} do
    other = user_fixture()
    {:ok, other_project} = Projects.create_project(%{name: "Other", user_id: other.id})
    assert_raise Ecto.NoResultsError, fn ->
      live(conn, ~p"/projects/#{other_project.id}")
    end
  end
end
