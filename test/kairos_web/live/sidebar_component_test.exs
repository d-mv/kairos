defmodule KairosWeb.SidebarComponentTest do
  use KairosWeb.ConnCase, async: true

  import Phoenix.LiveViewTest
  import Kairos.AccountsFixtures

  alias Kairos.{Areas, Projects}

  setup %{conn: conn} do
    user = user_fixture()
    {:ok, conn: log_in_user(conn, user), user: user}
  end

  defp live_inbox(conn), do: live(conn, ~p"/inbox")

  test "sidebar renders with area and project", %{conn: conn, user: user} do
    {:ok, _} = Areas.create_area(%{name: "Side Area", user_id: user.id})
    {:ok, _lv, html} = live_inbox(conn)
    assert html =~ "Side Area"
  end

  test "creates area via sidebar", %{conn: conn, user: user} do
    {:ok, lv, _html} = live_inbox(conn)
    lv |> element("#sidebar-create-area-btn") |> render_click()
    lv |> form("#sidebar-new-area-form", %{name: "New Sidebar Area"}) |> render_submit()
    assert Enum.any?(Areas.list_areas(user.id), &(&1.name == "New Sidebar Area"))
  end

  test "creates project via sidebar", %{conn: conn, user: user} do
    {:ok, lv, _html} = live_inbox(conn)
    lv |> element("#sidebar-create-project-btn") |> render_click()
    lv |> form("#sidebar-new-project-form", %{name: "New Sidebar Project"}) |> render_submit()
    assert Enum.any?(Projects.list_projects(user.id), &(&1.name == "New Sidebar Project"))
  end

  test "creates project in area via sidebar", %{conn: conn, user: user} do
    {:ok, area} = Areas.create_area(%{name: "Target Area", user_id: user.id})
    {:ok, lv, _html} = live_inbox(conn)
    lv |> element("#sidebar-add-project-to-area-#{area.id}") |> render_click()
    lv |> form("#sidebar-new-project-area-form-#{area.id}", %{name: "Area Project"}) |> render_submit()
    projects = Projects.list_for_area(area.id, user.id)
    assert Enum.any?(projects, &(&1.name == "Area Project"))
  end

  test "renames area via sidebar menu", %{conn: conn, user: user} do
    {:ok, area} = Areas.create_area(%{name: "Old Area Name", user_id: user.id})
    {:ok, lv, _html} = live_inbox(conn)
    lv |> element("#sidebar-area-menu-btn-#{area.id}") |> render_click()
    lv |> element("#sidebar-area-menu-#{area.id} button", "Rename") |> render_click()
    lv |> form("#sidebar-rename-area-form-#{area.id}", %{name: "New Area Name"}) |> render_submit()
    assert Areas.get_area!(area.id, user.id).name == "New Area Name"
  end

  test "renames project via sidebar menu", %{conn: conn, user: user} do
    {:ok, project} = Projects.create_project(%{name: "Old Project", user_id: user.id})
    {:ok, lv, _html} = live_inbox(conn)
    lv |> element("#sidebar-project-menu-btn-#{project.id}") |> render_click()
    lv |> element("#sidebar-project-menu-#{project.id} button", "Rename") |> render_click()
    lv |> form("#sidebar-rename-project-form-#{project.id}", %{name: "New Project Name"}) |> render_submit()
    assert Projects.get_project!(project.id, user.id).name == "New Project Name"
  end

  test "deletes area via sidebar menu", %{conn: conn, user: user} do
    {:ok, area} = Areas.create_area(%{name: "Delete Me", user_id: user.id})
    {:ok, lv, _html} = live_inbox(conn)
    lv |> element("#sidebar-area-menu-btn-#{area.id}") |> render_click()
    lv |> element("#sidebar-area-menu-#{area.id} button", "Delete") |> render_click()
    lv |> element("#confirm-delete-area-modal-#{area.id} button", "Delete") |> render_click()
    assert_raise Ecto.NoResultsError, fn -> Areas.get_area!(area.id, user.id) end
  end

  test "deletes project via sidebar menu", %{conn: conn, user: user} do
    {:ok, project} = Projects.create_project(%{name: "Delete Project", user_id: user.id})
    {:ok, lv, _html} = live_inbox(conn)
    lv |> element("#sidebar-project-menu-btn-#{project.id}") |> render_click()
    lv |> element("#sidebar-project-menu-#{project.id} button", "Delete") |> render_click()
    lv |> element("#confirm-delete-project-modal-#{project.id} button", "Delete") |> render_click()
    assert Projects.get_project(project.id, user.id) == nil
  end

  test "cancels sidebar creation via toggle", %{conn: conn} do
    {:ok, lv, _html} = live_inbox(conn)
    lv |> element("#sidebar-create-area-btn") |> render_click()
    assert has_element?(lv, "#sidebar-new-area-form")
    lv |> element("#sidebar-create-area-btn") |> render_click()
    refute has_element?(lv, "#sidebar-new-area-form")
  end
end
