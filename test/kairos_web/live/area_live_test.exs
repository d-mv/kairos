defmodule KairosWeb.AreaLiveTest do
  use KairosWeb.ConnCase, async: true

  import Phoenix.LiveViewTest
  import Kairos.AccountsFixtures

  alias Kairos.{Tasks, Areas, Projects}

  setup %{conn: conn} do
    user = user_fixture()
    {:ok, area} = Areas.create_area(%{name: "My Area", user_id: user.id})
    {:ok, conn: log_in_user(conn, user), user: user, area: area}
  end

  test "renders area page", %{conn: conn, area: area} do
    {:ok, _lv, html} = live(conn, ~p"/areas/#{area.id}")
    assert html =~ "My Area"
  end

  test "shows area tasks", %{conn: conn, user: user, area: area} do
    {:ok, _} = Tasks.create_task(%{title: "Area task", user_id: user.id, area_id: area.id})
    {:ok, _lv, html} = live(conn, ~p"/areas/#{area.id}")
    assert html =~ "Area task"
  end

  test "shows area projects", %{conn: conn, user: user, area: area} do
    {:ok, _} = Projects.create_project(%{name: "Area project", user_id: user.id, area_id: area.id})
    {:ok, _lv, html} = live(conn, ~p"/areas/#{area.id}")
    assert html =~ "Area project"
  end

  test "creates a task in area", %{conn: conn, user: user, area: area} do
    {:ok, lv, _html} = live(conn, ~p"/areas/#{area.id}")
    lv |> form("#area-add-form", %{title: "New area task"}) |> render_submit()
    tasks = Tasks.list_for_area(area.id, user.id)
    assert Enum.any?(tasks, &(&1.title == "New area task"))
  end

  test "completes a task", %{conn: conn, user: user, area: area} do
    {:ok, task} = Tasks.create_task(%{title: "Complete", user_id: user.id, area_id: area.id})
    {:ok, lv, _html} = live(conn, ~p"/areas/#{area.id}")
    lv |> element("#task-checkbox-#{task.id}") |> render_click()
    assert Tasks.get_task!(task.id, user.id).status == "completed"
  end

  test "reopens a completed task", %{conn: conn, user: user, area: area} do
    {:ok, task} = Tasks.create_task(%{title: "Reopen", user_id: user.id, area_id: area.id})
    {:ok, _} = Tasks.complete_task(task)
    {:ok, lv, _html} = live(conn, ~p"/areas/#{area.id}")
    lv |> element("#task-checkbox-#{task.id}") |> render_click()
    assert Tasks.get_task!(task.id, user.id).status == "pending"
  end

  test "renames area", %{conn: conn, user: user, area: area} do
    {:ok, lv, _html} = live(conn, ~p"/areas/#{area.id}")
    lv |> element("#area-menu-btn") |> render_click()
    lv |> element("button", "Rename") |> render_click()
    lv |> form("#area-rename-form", %{name: "Renamed Area"}) |> render_submit()
    assert Areas.get_area!(area.id, user.id).name == "Renamed Area"
  end

  test "deletes area", %{conn: conn, user: user, area: area} do
    {:ok, lv, _html} = live(conn, ~p"/areas/#{area.id}")
    lv |> element("#area-menu-btn") |> render_click()
    lv |> element("button", "Delete") |> render_click()
    lv |> element("button", "Delete area") |> render_click()
    assert_redirect(lv, ~p"/")
    assert_raise Ecto.NoResultsError, fn -> Areas.get_area!(area.id, user.id) end
  end

  test "redirects if area not owned by user", %{conn: conn} do
    other = user_fixture()
    {:ok, other_area} = Areas.create_area(%{name: "Other", user_id: other.id})
    assert_raise Ecto.NoResultsError, fn ->
      live(conn, ~p"/areas/#{other_area.id}")
    end
  end

  test "hides completed projects by default", %{conn: conn, user: user, area: area} do
    {:ok, project} = Projects.create_project(%{name: "Done Project", user_id: user.id, area_id: area.id})
    {:ok, _} = Projects.complete_project(project)
    {:ok, _lv, html} = live(conn, ~p"/areas/#{area.id}")
    refute html =~ "Done Project"
  end

  test "shows completed projects after toggling in dropdown", %{conn: conn, user: user, area: area} do
    {:ok, project} = Projects.create_project(%{name: "Done Project", user_id: user.id, area_id: area.id})
    {:ok, _} = Projects.complete_project(project)
    {:ok, lv, _html} = live(conn, ~p"/areas/#{area.id}")
    lv |> element("#area-menu-btn") |> render_click()
    lv |> element("button", "Show completed projects") |> render_click()
    assert render(lv) =~ "Done Project"
  end
end
