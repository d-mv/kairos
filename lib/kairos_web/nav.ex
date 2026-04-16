defmodule KairosWeb.Nav do
  @moduledoc """
  Loads sidebar navigation data (areas, projects) into socket assigns
  for all authenticated LiveViews.
  """
  import Phoenix.Component, only: [assign: 2]

  alias Kairos.{Areas, Projects}

  def on_mount(:load_nav, _params, _session, socket) do
    case socket.assigns[:current_scope] do
      %{user: %{id: user_id}} ->
        areas = Areas.list_areas(user_id)
        projects = Projects.list_projects(user_id)
        {:cont, assign(socket, nav_areas: areas, nav_projects: projects)}

      _ ->
        {:cont, assign(socket, nav_areas: [], nav_projects: [])}
    end
  end
end
