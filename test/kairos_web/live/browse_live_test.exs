defmodule KairosWeb.BrowseLiveTest do
  use KairosWeb.ConnCase, async: true

  import Phoenix.LiveViewTest
  import Kairos.AccountsFixtures

  alias Kairos.{Areas, Projects}

  setup %{conn: conn} do
    user = user_fixture()
    {:ok, conn: log_in_user(conn, user), user: user}
  end

  test "renders browse page", %{conn: conn} do
    {:ok, _lv, html} = live(conn, ~p"/browse")
    assert html =~ "Browse"
  end

  test "shows existing areas", %{conn: conn, user: user} do
    {:ok, _} = Areas.create_area(%{name: "My Area", user_id: user.id})
    {:ok, _lv, html} = live(conn, ~p"/browse")
    assert html =~ "My Area"
  end

  test "shows existing projects", %{conn: conn, user: user} do
    {:ok, _} = Projects.create_project(%{name: "My Project", user_id: user.id})
    {:ok, _lv, html} = live(conn, ~p"/browse")
    assert html =~ "My Project"
  end

  test "creates an area", %{conn: conn, user: user} do
    {:ok, lv, _html} = live(conn, ~p"/browse")
    lv |> element("#browse-areas button[phx-click='toggle_create_area']") |> render_click()
    lv |> form("#browse-new-area-form", %{name: "New Area"}) |> render_submit()
    assert Enum.any?(Areas.list_areas(user.id), &(&1.name == "New Area"))
  end

  test "creates a standalone project", %{conn: conn, user: user} do
    {:ok, lv, _html} = live(conn, ~p"/browse")
    lv |> element("button[phx-click='toggle_create_project'][phx-value-area-id='_none']") |> render_click()
    lv |> form("#browse-new-standalone-project-form", %{name: "Standalone"}) |> render_submit()
    assert Enum.any?(Projects.list_projects(user.id), &(&1.name == "Standalone"))
  end

  test "deletes an area", %{conn: conn, user: user} do
    {:ok, area} = Areas.create_area(%{name: "Delete Area", user_id: user.id})
    {:ok, lv, _html} = live(conn, ~p"/browse")
    lv |> element("button[phx-click='toggle_menu'][phx-value-id='#{area.id}']") |> render_click()
    lv |> element("button[phx-click='confirm_delete_area'][phx-value-id='#{area.id}']") |> render_click()
    lv |> element("button", "Delete") |> render_click()
    refute has_element?(lv, "#browse-area-#{area.id}")
  end

  test "deletes a project", %{conn: conn, user: user} do
    {:ok, project} = Projects.create_project(%{name: "Delete Project", user_id: user.id})
    {:ok, lv, _html} = live(conn, ~p"/browse")
    lv |> element("button[phx-click='toggle_menu'][phx-value-id='#{project.id}']") |> render_click()
    lv |> element("button[phx-click='confirm_delete_project'][phx-value-id='#{project.id}']") |> render_click()
    lv |> element("button", "Delete") |> render_click()
    refute has_element?(lv, "#browse-project-#{project.id}")
  end

  test "does not show other users areas", %{conn: conn} do
    other = user_fixture()
    {:ok, _} = Areas.create_area(%{name: "Other Area", user_id: other.id})
    {:ok, _lv, html} = live(conn, ~p"/browse")
    refute html =~ "Other Area"
  end

  test "cancels area creation", %{conn: conn} do
    {:ok, lv, _html} = live(conn, ~p"/browse")
    lv |> element("#browse-areas button[phx-click='toggle_create_area']") |> render_click()
    assert has_element?(lv, "#browse-new-area-form")
    lv |> element("#browse-areas button[phx-click='toggle_create_area']") |> render_click()
    refute has_element?(lv, "#browse-new-area-form")
  end
end
