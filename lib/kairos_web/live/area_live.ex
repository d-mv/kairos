defmodule KairosWeb.AreaLive do
  use KairosWeb, :live_view

  alias Kairos.{Areas, Projects, Tasks}
  import KairosWeb.Components.TaskItem

  @impl true
  def mount(%{"id" => id}, _session, socket) do
    user_id = socket.assigns.current_scope.user.id

    if connected?(socket) do
      Phoenix.PubSub.subscribe(Kairos.PubSub, "user:#{user_id}")
    end

    area = Areas.get_area!(id, user_id)
    projects = Projects.list_for_area(id, user_id)
    tasks = Tasks.list_for_area(id, user_id)

    {:ok,
     assign(socket,
       area: area,
       projects: projects,
       tasks: tasks,
       new_task_title: "",
       page_title: area.name,
       header_menu_open: false,
       renaming: false,
       confirm_delete: nil,
       active_tab: "browse"
     )}
  end

  @impl true
  def handle_event("create_task", %{"title" => title}, socket) when byte_size(title) > 0 do
    user_id = socket.assigns.current_scope.user.id
    area_id = socket.assigns.area.id

    case Tasks.create_task(%{title: String.trim(title), user_id: user_id, area_id: area_id}) do
      {:ok, _} ->
        tasks = Tasks.list_for_area(area_id, user_id)
        Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
        {:noreply, assign(socket, tasks: tasks, new_task_title: "")}

      {:error, _} ->
        {:noreply, socket}
    end
  end

  def handle_event("create_task", _params, socket), do: {:noreply, socket}

  @impl true
  def handle_event("complete_task", %{"id" => id}, socket) do
    user_id = socket.assigns.current_scope.user.id
    task = Tasks.get_task!(id, user_id)
    {:ok, _} = Tasks.complete_task(task)
    Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
    tasks = Tasks.list_for_area(socket.assigns.area.id, user_id)
    {:noreply, assign(socket, tasks: tasks)}
  end

  @impl true
  def handle_event("toggle_header_menu", _params, socket) do
    {:noreply, assign(socket, header_menu_open: !socket.assigns.header_menu_open, confirm_delete: nil)}
  end

  def handle_event("close_header_menu", _params, socket) do
    {:noreply, assign(socket, header_menu_open: false)}
  end

  def handle_event("start_rename", _params, socket) do
    {:noreply, assign(socket, renaming: true, header_menu_open: false)}
  end

  def handle_event("save_rename", %{"name" => name}, socket) when byte_size(name) > 0 do
    area = socket.assigns.area

    case Areas.update_area(area, %{name: String.trim(name)}) do
      {:ok, updated_area} ->
        {:noreply, assign(socket, area: updated_area, renaming: false, page_title: updated_area.name)}

      {:error, _} ->
        {:noreply, socket}
    end
  end

  def handle_event("save_rename", _params, socket) do
    {:noreply, assign(socket, renaming: false)}
  end

  def handle_event("cancel_rename", _params, socket) do
    {:noreply, assign(socket, renaming: false)}
  end

  def handle_event("confirm_delete", _params, socket) do
    area = socket.assigns.area
    task_count = Areas.count_tasks(area.id)
    project_count = length(socket.assigns.projects)
    {:noreply, assign(socket, confirm_delete: %{task_count: task_count, project_count: project_count}, header_menu_open: false)}
  end

  def handle_event("delete_area", _params, socket) do
    {:ok, _} = Areas.delete_area(socket.assigns.area)
    {:noreply, push_navigate(socket, to: ~p"/")}
  end

  def handle_event("cancel_delete", _params, socket) do
    {:noreply, assign(socket, confirm_delete: nil)}
  end

  @impl true
  def handle_info({:tasks_changed, _}, socket) do
    user_id = socket.assigns.current_scope.user.id
    tasks = Tasks.list_for_area(socket.assigns.area.id, user_id)
    projects = Projects.list_for_area(socket.assigns.area.id, user_id)
    {:noreply, assign(socket, tasks: tasks, projects: projects)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app flash={@flash} current_scope={@current_scope} nav_areas={assigns[:nav_areas] || []} nav_projects={assigns[:nav_projects] || []}>
      <div id="area-container" class="w-full py-8 px-4">
        <!-- Header -->
        <div id="area-header" class="flex items-center gap-2 mb-6">
          <%= if @renaming do %>
            <form id="area-rename-form" phx-submit="save_rename" class="flex items-center gap-2 flex-1">
              <input
                id="area-rename-input"
                type="text"
                name="name"
                value={@area.name}
                class="text-2xl font-semibold border-b border-border bg-transparent focus:outline-none focus:border-primary w-full"
                phx-mounted={JS.focus()}
                phx-keydown="cancel_rename"
                phx-key="Escape"
                autocomplete="off"
              />
            </form>
          <% else %>
            <h1 id="area-title" class="text-2xl font-semibold flex-1"><%= @area.name %></h1>
            <div class="relative">
              <button
                id="area-menu-btn"
                phx-click="toggle_header_menu"
                class="p-1 rounded hover:bg-muted text-muted-foreground"
                title="Area options"
              >
                <.icon name="hero-ellipsis-horizontal" class="w-5 h-5" />
              </button>

              <%= if @header_menu_open do %>
                <div
                  id="area-header-menu"
                  class="absolute right-0 top-8 z-50 w-40 bg-background border border-border rounded-md shadow-md py-1"
                  phx-click-away="close_header_menu"
                >
                  <button
                    phx-click="start_rename"
                    class="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <.icon name="hero-pencil" class="w-4 h-4" /> Rename
                  </button>
                  <button
                    phx-click="confirm_delete"
                    class="w-full text-left px-3 py-2 text-sm hover:bg-muted text-destructive flex items-center gap-2"
                  >
                    <.icon name="hero-trash" class="w-4 h-4" /> Delete
                  </button>
                </div>
              <% end %>
            </div>
          <% end %>
        </div>

        <!-- Delete confirmation -->
        <%= if @confirm_delete do %>
          <div id="area-confirm-delete" class="mb-6 p-3 rounded border border-destructive/30 bg-destructive/5 text-sm">
            <p class="text-muted-foreground mb-2">
              Delete area "<%= @area.name %>"?
              <%= if @confirm_delete.task_count > 0 do %>
                <%= @confirm_delete.task_count %> tasks will move to inbox.
              <% end %>
              <%= if @confirm_delete.project_count > 0 do %>
                <%= @confirm_delete.project_count %> projects will lose area grouping.
              <% end %>
            </p>
            <div class="flex gap-4">
              <button phx-click="delete_area" class="text-destructive font-medium hover:underline">Delete area</button>
              <button phx-click="cancel_delete" class="text-muted-foreground hover:underline">Cancel</button>
            </div>
          </div>
        <% end %>

        <%= if Enum.any?(@projects) do %>
          <section id="area-projects-section" class="mb-8">
            <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Projects</h2>
            <ul id="area-project-list" class="space-y-1">
              <%= for project <- @projects do %>
                <li id={"project-#{project.id}"}>
                  <.link navigate={~p"/projects/#{project.id}"} class="flex items-center gap-2 p-2 rounded hover:bg-muted text-sm">
                    <.icon name="hero-folder" class="w-4 h-4 text-muted-foreground" />
                    <%= project.name %>
                  </.link>
                </li>
              <% end %>
            </ul>
          </section>
        <% end %>

        <section id="area-tasks-section">
          <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Tasks</h2>

          <form id="area-add-form" phx-submit="create_task" class="flex gap-2 mb-4">
            <input
              id="new-task-input"
              type="text"
              name="title"
              value={@new_task_title}
              placeholder="Add a task…"
              class="flex-1 border rounded px-3 py-2 text-sm"
              autocomplete="off"
            />
            <button id="add-task-btn" type="submit" class="px-4 py-2 bg-primary text-primary-foreground rounded text-sm">Add</button>
          </form>

          <ul id="area-task-list" class="space-y-1">
            <%= for task <- @tasks do %>
              <.task_item task={task} />
            <% end %>
          </ul>
        </section>
      </div>
    </Layouts.app>
    """
  end
end
