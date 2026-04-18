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
       area_menu_open: nil,
       project_menu_open: nil,
       renaming_area: nil,
       renaming_project: nil,
       confirm_delete_area: nil,
       confirm_delete_project: nil,
       confirm_demote_project: nil,
       demote_error: nil
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

  def update(assigns, socket), do: {:ok, assign(socket, assigns)}

  # ── Create area/project ────────────────────────────────────────────────

  @impl true
  def handle_event("toggle_create_area", _params, socket) do
    {:noreply,
     assign(socket,
       creating_area: !socket.assigns.creating_area,
       creating_project: nil,
       new_name: "",
       area_menu_open: nil,
       project_menu_open: nil
     )}
  end

  def handle_event("toggle_create_project", %{"area-id" => area_id}, socket) do
    toggle = if socket.assigns.creating_project == area_id, do: nil, else: area_id
    {:noreply, assign(socket, creating_project: toggle, creating_area: false, new_name: "", area_menu_open: nil, project_menu_open: nil)}
  end

  def handle_event("toggle_create_project", _params, socket) do
    toggle = if socket.assigns.creating_project == "_none", do: nil, else: "_none"
    {:noreply, assign(socket, creating_project: toggle, creating_area: false, new_name: "", area_menu_open: nil, project_menu_open: nil)}
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

  # ── Menus ──────────────────────────────────────────────────────────────

  def handle_event("toggle_area_menu", %{"id" => id}, socket) do
    open = if socket.assigns.area_menu_open == id, do: nil, else: id
    {:noreply, assign(socket, area_menu_open: open, project_menu_open: nil, confirm_delete_area: nil, confirm_delete_project: nil, confirm_demote_project: nil)}
  end

  def handle_event("toggle_project_menu", %{"id" => id}, socket) do
    open = if socket.assigns.project_menu_open == id, do: nil, else: id
    {:noreply, assign(socket, project_menu_open: open, area_menu_open: nil, confirm_delete_area: nil, confirm_delete_project: nil, confirm_demote_project: nil)}
  end

  def handle_event("close_menus", _params, socket) do
    {:noreply, assign(socket, area_menu_open: nil, project_menu_open: nil)}
  end

  # ── Rename area ────────────────────────────────────────────────────────

  def handle_event("start_rename_area", %{"id" => id}, socket) do
    {:noreply, assign(socket, renaming_area: id, area_menu_open: nil)}
  end

  def handle_event("save_rename_area", %{"record_id" => id, "name" => name}, socket)
      when byte_size(name) > 0 do
    user_id = socket.assigns.current_scope.user.id
    area = Enum.find(socket.assigns.areas, &(&1.id == id))

    case Areas.update_area(area, %{name: String.trim(name)}) do
      {:ok, _} ->
        areas = Areas.list_areas(user_id)
        {:noreply, assign(socket, areas: areas, renaming_area: nil)}

      {:error, _} ->
        {:noreply, socket}
    end
  end

  def handle_event("save_rename_area", _params, socket) do
    {:noreply, assign(socket, renaming_area: nil)}
  end

  # ── Rename project ─────────────────────────────────────────────────────

  def handle_event("start_rename_project", %{"id" => id}, socket) do
    {:noreply, assign(socket, renaming_project: id, project_menu_open: nil)}
  end

  def handle_event("save_rename_project", %{"record_id" => id, "name" => name}, socket)
      when byte_size(name) > 0 do
    user_id = socket.assigns.current_scope.user.id
    project = Enum.find(socket.assigns.projects, &(&1.id == id))

    case Projects.update_project(project, %{name: String.trim(name)}) do
      {:ok, _} ->
        projects = Projects.list_projects(user_id)
        {:noreply, assign(socket, projects: projects, renaming_project: nil)}

      {:error, _} ->
        {:noreply, socket}
    end
  end

  def handle_event("save_rename_project", _params, socket) do
    {:noreply, assign(socket, renaming_project: nil)}
  end

  def handle_event("cancel_rename", _params, socket) do
    {:noreply, assign(socket, renaming_area: nil, renaming_project: nil)}
  end

  # ── Delete area ────────────────────────────────────────────────────────

  def handle_event("confirm_delete_area", %{"id" => id}, socket) do
    area = Enum.find(socket.assigns.areas, &(&1.id == id))
    task_count = Areas.count_tasks(id)
    project_count = Enum.count(socket.assigns.projects, &(&1.area_id == id))

    {:noreply,
     assign(socket,
       confirm_delete_area: %{area: area, task_count: task_count, project_count: project_count},
       area_menu_open: nil
     )}
  end

  def handle_event("delete_area", %{"id" => id}, socket) do
    user_id = socket.assigns.current_scope.user.id
    area = Enum.find(socket.assigns.areas, &(&1.id == id))
    {:ok, _} = Areas.delete_area(area)
    areas = Areas.list_areas(user_id)
    projects = Projects.list_projects(user_id)
    {:noreply, assign(socket, areas: areas, projects: projects, confirm_delete_area: nil)}
  end

  # ── Delete project ─────────────────────────────────────────────────────

  def handle_event("confirm_delete_project", %{"id" => id}, socket) do
    project = Enum.find(socket.assigns.projects, &(&1.id == id))
    task_count = Projects.count_tasks(id)

    {:noreply,
     assign(socket,
       confirm_delete_project: %{project: project, task_count: task_count},
       project_menu_open: nil
     )}
  end

  def handle_event("delete_project", %{"id" => id}, socket) do
    user_id = socket.assigns.current_scope.user.id
    project = Enum.find(socket.assigns.projects, &(&1.id == id))
    {:ok, _} = Projects.delete_project(project)
    projects = Projects.list_projects(user_id)
    {:noreply, assign(socket, projects: projects, confirm_delete_project: nil)}
  end

  # ── Demote project ─────────────────────────────────────────────────────

  def handle_event("confirm_demote_project", %{"id" => id}, socket) do
    project = Enum.find(socket.assigns.projects, &(&1.id == id))
    {:noreply, assign(socket, confirm_demote_project: project, project_menu_open: nil, demote_error: nil)}
  end

  def handle_event("demote_project", %{"id" => id}, socket) do
    user_id = socket.assigns.current_scope.user.id
    project = Enum.find(socket.assigns.projects, &(&1.id == id))

    case Projects.demote_to_task(project) do
      {:ok, _task} ->
        projects = Projects.list_projects(user_id)
        {:noreply, assign(socket, projects: projects, confirm_demote_project: nil, demote_error: nil)}

      {:error, :has_subtasks} ->
        {:noreply, assign(socket, demote_error: "Cannot demote: project tasks have subtasks.", confirm_demote_project: nil)}
    end
  end

  def handle_event("cancel_confirm", _params, socket) do
    {:noreply,
     assign(socket,
       confirm_delete_area: nil,
       confirm_delete_project: nil,
       confirm_demote_project: nil,
       demote_error: nil
     )}
  end

  # ── Sub-components ─────────────────────────────────────────────────────

  attr :area, :map, required: true
  attr :renaming, :boolean, required: true
  attr :menu_open, :boolean, required: true
  attr :target, :any, required: true

  defp area_row(assigns) do
    ~H"""
    <%= if @renaming do %>
      <form
        id={"sidebar-rename-area-form-#{@area.id}"}
        phx-submit="save_rename_area"
        phx-target={@target}
        class="flex items-center gap-1 px-2 py-1"
      >
        <input type="hidden" name="record_id" value={@area.id} />
        <.icon name="hero-square-2-stack" class="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          name="name"
          value={@area.name}
          class="flex-1 text-sm border rounded px-1 py-0.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          phx-mounted={JS.focus()}
          phx-keydown="cancel_rename"
          phx-key="Escape"
          phx-target={@target}
        />
      </form>
    <% else %>
      <div class="flex items-center rounded hover:bg-muted group/area relative">
        <.link
          id={"sidebar-area-#{@area.id}"}
          navigate={~p"/areas/#{@area.id}"}
          class="flex items-center gap-2 px-2 py-1.5 text-sm flex-1 min-w-0"
        >
          <.icon name="hero-square-2-stack" class="w-4 h-4 text-muted-foreground shrink-0" />
          <span class="flex-1 truncate">{@area.name}</span>
        </.link>
        <div class="flex items-center gap-0.5 pr-1 shrink-0 opacity-0 group-hover/area:opacity-100">
          <button
            id={"sidebar-add-project-to-area-#{@area.id}"}
            phx-click="toggle_create_project"
            phx-value-area-id={@area.id}
            phx-target={@target}
            class="p-0.5 rounded hover:bg-muted text-muted-foreground"
            title="New project in area"
          >
            <.icon name="hero-plus" class="w-3 h-3" />
          </button>
          <div class="relative">
            <button
              id={"sidebar-area-menu-btn-#{@area.id}"}
              phx-click="toggle_area_menu"
              phx-value-id={@area.id}
              phx-target={@target}
              class="p-0.5 rounded hover:bg-muted text-muted-foreground"
              title="Area options"
            >
              <.icon name="hero-ellipsis-horizontal" class="w-3 h-3" />
            </button>
            <%= if @menu_open do %>
              <div
                id={"sidebar-area-menu-#{@area.id}"}
                class="absolute right-0 top-full mt-1 z-50 w-36 bg-background border border-border rounded-xl shadow-xl py-1"
                phx-click-away="close_menus"
                phx-target={@target}
              >
                <button
                  phx-click="start_rename_area"
                  phx-value-id={@area.id}
                  phx-target={@target}
                  class="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2"
                >
                  <.icon name="hero-pencil" class="w-3.5 h-3.5 text-muted-foreground" /> Rename
                </button>
                <button
                  phx-click="confirm_delete_area"
                  phx-value-id={@area.id}
                  phx-target={@target}
                  class="w-full text-left px-3 py-1.5 text-sm hover:bg-muted text-destructive flex items-center gap-2"
                >
                  <.icon name="hero-trash" class="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            <% end %>
          </div>
        </div>
      </div>
    <% end %>
    """
  end

  attr :project, :map, required: true
  attr :renaming, :boolean, required: true
  attr :menu_open, :boolean, required: true
  attr :indent, :boolean, default: false
  attr :target, :any, required: true

  defp project_row(assigns) do
    ~H"""
    <div id={"sidebar-project-wrapper-#{@project.id}"} class="relative">
      <%= if @renaming do %>
        <form
          id={"sidebar-rename-project-form-#{@project.id}"}
          phx-submit="save_rename_project"
          phx-target={@target}
          class={["flex items-center gap-1 py-1", if(@indent, do: "pl-7 pr-2", else: "px-2")]}
        >
          <input type="hidden" name="record_id" value={@project.id} />
          <.icon name="hero-folder" class={["text-muted-foreground shrink-0", if(@indent, do: "w-3.5 h-3.5", else: "w-4 h-4")]} />
          <input
            type="text"
            name="name"
            value={@project.name}
            class="flex-1 text-sm border rounded px-1 py-0.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            phx-mounted={JS.focus()}
            phx-keydown="cancel_rename"
            phx-key="Escape"
            phx-target={@target}
          />
        </form>
      <% else %>
        <div class="flex items-center rounded hover:bg-muted group/proj">
          <.link
            id={"sidebar-project-#{@project.id}"}
            navigate={~p"/projects/#{@project.id}"}
            class={["flex items-center gap-2 py-1.5 text-sm flex-1 min-w-0", if(@indent, do: "pl-7 pr-2 text-muted-foreground", else: "px-2")]}
          >
            <.icon name="hero-folder" class={["shrink-0", if(@indent, do: "w-3.5 h-3.5", else: "w-4 h-4 text-muted-foreground")]} />
            <span class="flex-1 truncate">{@project.name}</span>
          </.link>
          <div class="relative">
            <button
              id={"sidebar-project-menu-btn-#{@project.id}"}
              phx-click="toggle_project_menu"
              phx-value-id={@project.id}
              phx-target={@target}
              class="opacity-0 group-hover/proj:opacity-100 p-0.5 rounded hover:bg-muted text-muted-foreground mr-1 shrink-0"
              title="Project options"
            >
              <.icon name="hero-ellipsis-horizontal" class="w-3 h-3" />
            </button>
            <%= if @menu_open do %>
              <div
                id={"sidebar-project-menu-#{@project.id}"}
                class="absolute right-0 top-full mt-1 z-50 w-40 bg-background border border-border rounded-xl shadow-xl py-1"
                phx-click-away="close_menus"
                phx-target={@target}
              >
                <button
                  phx-click="start_rename_project"
                  phx-value-id={@project.id}
                  phx-target={@target}
                  class="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2"
                >
                  <.icon name="hero-pencil" class="w-3.5 h-3.5 text-muted-foreground" /> Rename
                </button>
                <button
                  phx-click="confirm_demote_project"
                  phx-value-id={@project.id}
                  phx-target={@target}
                  class="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2"
                >
                  <.icon name="hero-arrow-down-circle" class="w-3.5 h-3.5 text-muted-foreground" /> Demote to task
                </button>
                <button
                  phx-click="confirm_delete_project"
                  phx-value-id={@project.id}
                  phx-target={@target}
                  class="w-full text-left px-3 py-1.5 text-sm hover:bg-muted text-destructive flex items-center gap-2"
                >
                  <.icon name="hero-trash" class="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            <% end %>
          </div>
        </div>
      <% end %>
    </div>
    """
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
              <.icon name="hero-plus" class="w-3.5 h-3.5" />
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
              <div id={"sidebar-area-wrapper-#{area.id}"} class="space-y-0.5">
                <.area_row
                  area={area}
                  renaming={@renaming_area == area.id}
                  menu_open={@area_menu_open == area.id}
                  target={@myself}
                />

                <%= if @creating_project == area.id do %>
                  <form
                    id={"sidebar-new-project-area-form-#{area.id}"}
                    phx-submit="create_project"
                    phx-target={@myself}
                    class="pl-7 pr-2 pb-1"
                  >
                    <input type="hidden" name="area_id" value={area.id} />
                    <input
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

                <%= for project <- Enum.filter(@projects, &(&1.area_id == area.id)) do %>
                  <.project_row
                    project={project}
                    renaming={@renaming_project == project.id}
                    menu_open={@project_menu_open == project.id}
                    indent={true}
                    target={@myself}
                  />
                <% end %>
              </div>
            <% end %>
          </div>
        </div>

        <!-- Projects (no area) -->
        <div id="sidebar-projects-section" class="pt-4">
          <div class="flex items-center justify-between px-2 pb-1">
            <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Projects</span>
            <button
              id="sidebar-create-project-btn"
              phx-click="toggle_create_project"
              phx-target={@myself}
              class="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              title="New project"
            >
              <.icon name="hero-plus" class="w-3.5 h-3.5" />
            </button>
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
            <%= for project <- Enum.filter(@projects, &is_nil(&1.area_id)) do %>
              <.project_row
                project={project}
                renaming={@renaming_project == project.id}
                menu_open={@project_menu_open == project.id}
                indent={false}
                target={@myself}
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

      <%!-- Confirm Delete Area --%>
      <.modal
        :if={@confirm_delete_area}
        id="confirm-delete-area-modal"
        show={true}
        on_cancel={JS.push("cancel_confirm", target: @myself)}
      >
        <div class="text-left">
          <h3 class="text-lg font-semibold leading-6 text-foreground">Delete area</h3>
          <p class="mt-3 text-sm text-muted-foreground">
            Delete area "<%= @confirm_delete_area.area.name %>"?
            <%= if @confirm_delete_area.task_count > 0 do %>
              <%= @confirm_delete_area.task_count %> tasks will move to inbox.
            <% end %>
            <%= if @confirm_delete_area.project_count > 0 do %>
              <%= @confirm_delete_area.project_count %> projects will lose their area.
            <% end %>
          </p>
        </div>
        <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <.button phx-click={JS.push("cancel_confirm", target: @myself)} variant="secondary">Cancel</.button>
          <.button phx-click={JS.push("delete_area", value: %{id: @confirm_delete_area.area.id}, target: @myself)} class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </.button>
        </div>
      </.modal>

      <%!-- Confirm Delete Project --%>
      <.modal
        :if={@confirm_delete_project}
        id="confirm-delete-project-modal"
        show={true}
        on_cancel={JS.push("cancel_confirm", target: @myself)}
      >
        <div class="text-left">
          <h3 class="text-lg font-semibold leading-6 text-foreground">Delete project</h3>
          <p class="mt-3 text-sm text-muted-foreground">
            Delete project "<%= @confirm_delete_project.project.name %>"?
            <%= if @confirm_delete_project.task_count > 0 do %>
              <%= @confirm_delete_project.task_count %> tasks will move to inbox.
            <% end %>
          </p>
        </div>
        <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <.button phx-click={JS.push("cancel_confirm", target: @myself)} variant="secondary">Cancel</.button>
          <.button phx-click={JS.push("delete_project", value: %{id: @confirm_delete_project.project.id}, target: @myself)} class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </.button>
        </div>
      </.modal>

      <%!-- Confirm Demote Project --%>
      <.modal
        :if={@confirm_demote_project}
        id="confirm-demote-project-modal"
        show={true}
        on_cancel={JS.push("cancel_confirm", target: @myself)}
      >
        <div class="text-left">
          <h3 class="text-lg font-semibold leading-6 text-foreground">Convert to task</h3>
          <p class="mt-3 text-sm text-muted-foreground">
            Convert project "<%= @confirm_demote_project.name %>" to a task? All tasks within will move to inbox.
          </p>
        </div>
        <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <.button phx-click={JS.push("cancel_confirm", target: @myself)} variant="secondary">Cancel</.button>
          <.button phx-click={JS.push("demote_project", value: %{id: @confirm_demote_project.id}, target: @myself)} variant="primary">
            Convert
          </.button>
        </div>
      </.modal>

      <%!-- Error Modal (e.g. Demote Error) --%>
      <.modal
        :if={@demote_error}
        id="error-modal"
        show={true}
        on_cancel={JS.push("cancel_confirm", target: @myself)}
      >
        <div class="text-left">
          <h3 class="text-lg font-semibold leading-6 text-destructive">Error</h3>
          <p class="mt-3 text-sm text-muted-foreground"><%= @demote_error %></p>
        </div>
        <div class="mt-6 flex justify-end">
          <.button phx-click={JS.push("cancel_confirm", target: @myself)} variant="primary">OK</.button>
        </div>
      </.modal>
    </nav>
    """
  end
end
