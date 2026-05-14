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
        # Load navigation data in parallel to reduce initial render latency
        areas_task = Task.async(fn -> Areas.list_areas(user_id) end)
        projects_task = Task.async(fn -> Projects.list_projects(user_id) end)
        
        areas = Task.await(areas_task)
        projects = Task.await(projects_task)
        
        {:cont, assign(socket, nav_areas: areas, nav_projects: projects)}

      _ ->
        {:cont, assign(socket, nav_areas: [], nav_projects: [])}
    end
  end
end
