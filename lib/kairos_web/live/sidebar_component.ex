defmodule KairosWeb.SidebarComponent do
  use KairosWeb, :live_component

  import KairosWeb.Layouts, only: [theme_toggle: 1]

  alias Kairos.{Areas, Projects}

  @impl true
  def mount(socket) do
    {:ok,
     assign(socket,
       areas: [],
       projects: [],
       creating_area: false,
       creating_project: nil,
       new_name: "",
       show_completed_projects: false
     )}
  end

  @impl true
  def update(%{current_scope: %{user: %{id: user_id}}} = assigns, socket) do
    areas = Areas.list_areas(user_id)
    projects = Projects.list_projects(user_id)

    {:ok,
     socket
     |> assign(assigns)
     |> assign(areas: areas, projects: projects)}
  end

  def update(%{fetch_data: true}, socket) do
    user_id = socket.assigns.current_scope.user.id
    areas = Areas.list_areas(user_id)
    projects = Projects.list_projects(user_id)
    {:ok, assign(socket, areas: areas, projects: projects)}
  end

  def update(assigns, socket), do: {:ok, assign(socket, assigns)}

  # ── Create area/project ────────────────────────────────────────────────

  @impl true
  def handle_event("toggle_create_area", _params, socket) do
    {:noreply,
     assign(socket,
       creating_area: !socket.assigns.creating_area,
       creating_project: nil,
       new_name: ""
     )}
  end

  def handle_event("toggle_create_project", %{"area-id" => area_id}, socket) do
    toggle = if socket.assigns.creating_project == area_id, do: nil, else: area_id
    {:noreply, assign(socket, creating_project: toggle, creating_area: false, new_name: "")}
  end

  def handle_event("toggle_create_project", _params, socket) do
    toggle = if socket.assigns.creating_project == "_none", do: nil, else: "_none"
    {:noreply, assign(socket, creating_project: toggle, creating_area: false, new_name: "")}
  end

  def handle_event("cancel", _params, socket) do
    {:noreply, assign(socket, creating_area: false, creating_project: nil, new_name: "")}
  end

  def handle_event("create_area", %{"name" => name}, socket) when byte_size(name) > 0 do
    user_id = socket.assigns.current_scope.user.id

    case Areas.create_area(%{name: String.trim(name), user_id: user_id}) do
      {:ok, _} ->
        areas = Areas.list_areas(user_id)
        {:noreply, assign(socket, areas: areas, creating_area: false, new_name: "")}

      {:error, _} ->
        {:noreply, socket}
    end
  end

  def handle_event("create_area", _params, socket), do: {:noreply, socket}

  def handle_event("create_project", %{"name" => name} = params, socket)
      when byte_size(name) > 0 do
    user_id = socket.assigns.current_scope.user.id
    raw_area_id = Map.get(params, "area_id", "")
    area_id = if raw_area_id in ["", "_none"], do: nil, else: raw_area_id

    case Projects.create_project(%{name: String.trim(name), user_id: user_id, area_id: area_id}) do
      {:ok, _} ->
        projects = Projects.list_projects(user_id)
        {:noreply, assign(socket, projects: projects, creating_project: nil, new_name: "")}

      {:error, _} ->
        {:noreply, socket}
    end
  end

  def handle_event("create_project", _params, socket), do: {:noreply, socket}

  def handle_event("toggle_show_completed_projects", _params, socket) do
    {:noreply, assign(socket, show_completed_projects: !socket.assigns.show_completed_projects)}
  end

  # ── Render ─────────────────────────────────────────────────────────────

  @impl true
  def render(assigns) do
    ~H"""
    <nav id="sidebar" class={["w-56 shrink-0 border-r bg-muted/30 flex-col", if(@current_scope, do: "hidden md:flex", else: "hidden")]}>
      <div id="sidebar-header" class="p-4 border-b">
        <span class="font-semibold text-sm">Kairos</span>
      </div>

      <div id="sidebar-nav" class="flex-1 overflow-y-auto p-2 space-y-0.5">
        <.link navigate={~p"/inbox"} class="flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted">
          <.icon name="hero-inbox" class="w-4 h-4 text-muted-foreground" /> Inbox
        </.link>
        <.link navigate={~p"/today"} class="flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted">
          <.icon name="hero-sun" class="w-4 h-4 text-muted-foreground" /> Today
        </.link>
        <.link navigate={~p"/upcoming"} class="flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted">
          <.icon name="hero-calendar" class="w-4 h-4 text-muted-foreground" /> Upcoming
        </.link>
        <.link navigate={~p"/completed"} class="flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted">
          <.icon name="hero-check-circle" class="w-4 h-4 text-muted-foreground" /> Completed
        </.link>
        <.link navigate={~p"/search"} class="flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted">
          <.icon name="hero-magnifying-glass" class="w-4 h-4 text-muted-foreground" /> Search
        </.link>

        <!-- Areas -->
        <div id="sidebar-areas-section" class="pt-4">
          <div class="flex items-center justify-between px-2 pb-1">
            <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Areas</span>
            <button
              id="sidebar-create-area-btn"
              phx-click="toggle_create_area"
              phx-target={@myself}
              class="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              title="New area"
            >
              <.icon name="hero-plus" class="w-6 h-6" />
            </button>
          </div>

          <%= if @creating_area do %>
            <form id="sidebar-new-area-form" phx-submit="create_area" phx-target={@myself} class="px-2 pb-1">
              <input
                id="sidebar-new-area-input"
                type="text"
                name="name"
                placeholder="Area name"
                class="w-full text-sm border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                autofocus
                phx-mounted={JS.focus()}
                phx-keydown="cancel"
                phx-key="Escape"
                phx-target={@myself}
              />
            </form>
          <% end %>

          <div id="sidebar-areas">
            <%= for area <- @areas do %>
              <.live_component
                module={KairosWeb.SidebarAreaComponent}
                id={"sidebar-area-#{area.id}"}
                area={area}
                projects={Enum.filter(@projects, &(&1.area_id == area.id && (&1.status != "completed" || @show_completed_projects)))}
                current_scope={@current_scope}
              />
            <% end %>
          </div>
        </div>

        <!-- Projects (no area) -->
        <div id="sidebar-projects-section" class="pt-4">
          <div class="flex items-center justify-between px-2 pb-1">
            <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Projects</span>
            <div class="flex items-center gap-0.5">
              <button
                id="sidebar-toggle-completed-projects"
                phx-click="toggle_show_completed_projects"
                phx-target={@myself}
                class="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                title={if @show_completed_projects, do: "Hide completed projects", else: "Show completed projects"}
              >
                <.icon name={if @show_completed_projects, do: "hero-eye-slash", else: "hero-eye"} class="w-4 h-4" />
              </button>
              <button
                id="sidebar-create-project-btn"
                phx-click="toggle_create_project"
                phx-target={@myself}
                class="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                title="New project"
              >
                <.icon name="hero-plus" class="w-6 h-6" />
              </button>
            </div>
          </div>

          <%= if @creating_project == "_none" do %>
            <form id="sidebar-new-project-form" phx-submit="create_project" phx-target={@myself} class="px-2 pb-1">
              <input type="hidden" name="area_id" value="" />
              <input
                id="sidebar-new-project-input"
                type="text"
                name="name"
                placeholder="Project name"
                class="w-full text-sm border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                phx-mounted={JS.focus()}
                phx-keydown="cancel"
                phx-key="Escape"
                phx-target={@myself}
              />
            </form>
          <% end %>

          <div id="sidebar-projects">
            <%= for project <- Enum.filter(@projects, &(is_nil(&1.area_id) && (&1.status != "completed" || @show_completed_projects))) do %>
              <.live_component
                module={KairosWeb.SidebarProjectComponent}
                id={"sidebar-project-#{project.id}"}
                project={project}
                indent={false}
                current_scope={@current_scope}
              />
            <% end %>
          </div>
        </div>
      </div>

      <div id="sidebar-footer" class="p-2 border-t space-y-1">
        <%= if @current_scope do %>
          <div class="text-xs text-muted-foreground px-2 mb-1 truncate"><%= @current_scope.user.email %></div>
          <.link navigate={~p"/users/settings"} class="flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted">
            <.icon name="hero-cog-6-tooth" class="w-4 h-4 text-muted-foreground" /> Settings
          </.link>
          <.link
            href={~p"/users/log-out"}
            method="delete"
            class="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-muted-foreground hover:bg-muted w-full"
          >
            <.icon name="hero-arrow-right-on-rectangle" class="w-4 h-4" />
            Log out
          </.link>
        <% end %>
        <div class="mt-2 flex justify-end">
          <.theme_toggle />
        </div>
      </div>
    </nav>
    """
  end
end
