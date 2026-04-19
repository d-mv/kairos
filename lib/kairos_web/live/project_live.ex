defmodule KairosWeb.ProjectLive do
  use KairosWeb, :live_view

  alias Kairos.{Projects, Tasks}
  import KairosWeb.Components.TaskItem
  alias KairosWeb.TaskDetailComponent

  @impl true
  def mount(%{"id" => id}, _session, socket) do
    user_id = socket.assigns.current_scope.user.id

    if connected?(socket) do
      Phoenix.PubSub.subscribe(Kairos.PubSub, "user:#{user_id}")
    end

    project = Projects.get_project!(id, user_id)
    tasks = Tasks.list_for_project(id, user_id)

    {:ok,
     assign(socket,
       project: project,
       tasks: tasks,
       new_task_title: "",
       selected_task: nil,
       page_title: project.name,
       header_menu_open: false,
       renaming: false,
       confirm_delete: nil,
       confirm_demote: false,
       demote_error: nil,
       active_tab: "browse"
     )}
  end

  @impl true
  def handle_event("create_task", %{"title" => title}, socket) when byte_size(title) > 0 do
    user_id = socket.assigns.current_scope.user.id
    project_id = socket.assigns.project.id

    case Tasks.create_task(%{title: String.trim(title), user_id: user_id, project_id: project_id}) do
      {:ok, _} ->
        tasks = Tasks.list_for_project(project_id, user_id)
        Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
        {:noreply, assign(socket, tasks: tasks, new_task_title: "")}

      {:error, _} ->
        {:noreply, socket}
    end
  end

  def handle_event("create_task", _params, socket), do: {:noreply, socket}

  @impl true
  def handle_event("select_task", %{"id" => id}, socket) do
    user_id = socket.assigns.current_scope.user.id
    task = Tasks.get_task!(id, user_id)
    {:noreply, assign(socket, :selected_task, task)}
  end

  @impl true
  def handle_event("delete_task", %{"id" => id}, socket) do
    user_id = socket.assigns.current_scope.user.id
    task = Tasks.get_task!(id, user_id)
    {:ok, _} = Tasks.delete_task(task)
    Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
    tasks = Tasks.list_for_project(socket.assigns.project.id, user_id)
    {:noreply, assign(socket, tasks: tasks)}
  end

  @impl true
  def handle_event("complete_task", %{"id" => id}, socket) do
    user_id = socket.assigns.current_scope.user.id
    task = Tasks.get_task!(id, user_id)
    {:ok, _} = Tasks.complete_task(task)
    Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
    tasks = Tasks.list_for_project(socket.assigns.project.id, user_id)
    {:noreply, assign(socket, tasks: tasks)}
  end

  def handle_event("reopen_task", %{"id" => id}, socket) do
    user_id = socket.assigns.current_scope.user.id
    task = Tasks.get_task!(id, user_id)
    {:ok, _} = Tasks.reopen_task(task)
    Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
    tasks = Tasks.list_for_project(socket.assigns.project.id, user_id)
    {:noreply, assign(socket, tasks: tasks)}
  end

  @impl true
  def handle_event("toggle_header_menu", _params, socket) do
    {:noreply, assign(socket, header_menu_open: !socket.assigns.header_menu_open, confirm_delete: nil, confirm_demote: false, demote_error: nil)}
  end

  def handle_event("close_header_menu", _params, socket) do
    {:noreply, assign(socket, header_menu_open: false)}
  end

  def handle_event("start_rename", _params, socket) do
    {:noreply, assign(socket, renaming: true, header_menu_open: false)}
  end

  def handle_event("save_rename", %{"name" => name}, socket) when byte_size(name) > 0 do
    project = socket.assigns.project

    case Projects.update_project(project, %{name: String.trim(name)}) do
      {:ok, updated_project} ->
        {:noreply, assign(socket, project: updated_project, renaming: false, page_title: updated_project.name)}

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
    task_count = Projects.count_tasks(socket.assigns.project.id)
    {:noreply, assign(socket, confirm_delete: %{task_count: task_count}, header_menu_open: false)}
  end

  def handle_event("delete_project", _params, socket) do
    {:ok, _} = Projects.delete_project(socket.assigns.project)
    {:noreply, push_navigate(socket, to: ~p"/")}
  end

  def handle_event("cancel_delete", _params, socket) do
    {:noreply, assign(socket, confirm_delete: nil)}
  end

  def handle_event("confirm_demote", _params, socket) do
    {:noreply, assign(socket, confirm_demote: true, header_menu_open: false, demote_error: nil)}
  end

  def handle_event("demote_project", _params, socket) do
    case Projects.demote_to_task(socket.assigns.project) do
      {:ok, _task} ->
        {:noreply, push_navigate(socket, to: ~p"/inbox")}

      {:error, :has_subtasks} ->
        {:noreply,
         assign(socket,
           confirm_demote: false,
           demote_error: "Cannot demote: some tasks in this project have subtasks. Remove subtasks first."
         )}
    end
  end

  def handle_event("cancel_demote", _params, socket) do
    {:noreply, assign(socket, confirm_demote: false, demote_error: nil)}
  end

  @impl true
  def handle_info({:tasks_changed, _}, socket) do
    user_id = socket.assigns.current_scope.user.id
    tasks = Tasks.list_for_project(socket.assigns.project.id, user_id)

    selected_task =
      case socket.assigns.selected_task do
        nil -> nil
        task -> Enum.find(tasks, &(&1.id == task.id))
      end

    {:noreply, assign(socket, tasks: tasks, selected_task: selected_task)}
  end

  @impl true
  def handle_info({:close_task_detail}, socket) do
    user_id = socket.assigns.current_scope.user.id
    tasks = Tasks.list_for_project(socket.assigns.project.id, user_id)
    {:noreply, assign(socket, selected_task: nil, tasks: tasks)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app flash={@flash} current_scope={@current_scope} nav_areas={assigns[:nav_areas] || []} nav_projects={assigns[:nav_projects] || []}>
      <div id="project-container" class="w-full py-8 px-4">
        <!-- Header -->
        <div id="project-header" class="flex items-center gap-2 mb-6">
          <%= if @renaming do %>
            <form id="project-rename-form" phx-submit="save_rename" class="flex items-center gap-2 flex-1">
              <input
                id="project-rename-input"
                type="text"
                name="name"
                value={@project.name}
                class="text-2xl font-semibold border-b border-border bg-transparent focus:outline-none focus:border-primary w-full"
                phx-mounted={JS.focus()}
                phx-keydown="cancel_rename"
                phx-key="Escape"
                autocomplete="off"
              />
            </form>
          <% else %>
            <h1 id="project-title" class="text-2xl font-semibold flex-1"><%= @project.name %></h1>
            <div class="relative">
              <button
                id="project-menu-btn"
                phx-click="toggle_header_menu"
                class="p-1 rounded hover:bg-muted text-muted-foreground"
                title="Project options"
              >
                <.icon name="hero-ellipsis-horizontal" class="w-5 h-5" />
              </button>

              <%= if @header_menu_open do %>
                <div
                  id="project-header-menu"
                  class="absolute right-0 top-8 z-50 w-44 bg-background border border-border rounded-md shadow-md py-1"
                  phx-click-away="close_header_menu"
                >
                  <button
                    phx-click="start_rename"
                    class="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <.icon name="hero-pencil" class="w-4 h-4" /> Rename
                  </button>
                  <button
                    phx-click="confirm_demote"
                    class="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <.icon name="hero-arrow-down-circle" class="w-4 h-4" /> Demote to task
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
          <div id="project-confirm-delete" class="mb-6 p-3 rounded border border-destructive/30 bg-destructive/5 text-sm">
            <p class="text-muted-foreground mb-2">
              Delete project "<%= @project.name %>"?
              <%= if @confirm_delete.task_count > 0 do %>
                <%= @confirm_delete.task_count %> tasks will move to inbox.
              <% end %>
            </p>
            <div class="flex gap-4">
              <button phx-click="delete_project" class="text-destructive font-medium hover:underline">Delete project</button>
              <button phx-click="cancel_delete" class="text-muted-foreground hover:underline">Cancel</button>
            </div>
          </div>
        <% end %>

        <!-- Demote confirmation -->
        <%= if @confirm_demote do %>
          <div id="project-confirm-demote" class="mb-6 p-3 rounded border border-border bg-muted/30 text-sm">
            <p class="text-muted-foreground mb-2">
              Convert "<%= @project.name %>" to a task? All tasks in this project will move to inbox.
            </p>
            <div class="flex gap-4">
              <button phx-click="demote_project" class="font-medium hover:underline">Convert to task</button>
              <button phx-click="cancel_demote" class="text-muted-foreground hover:underline">Cancel</button>
            </div>
          </div>
        <% end %>

        <!-- Demote error -->
        <%= if @demote_error do %>
          <div id="project-demote-error" class="mb-6 p-3 rounded border border-destructive/30 bg-destructive/5 text-sm text-destructive">
            <%= @demote_error %>
          </div>
        <% end %>

        <form id="project-add-form" phx-submit="create_task" class="flex gap-2 mb-6">
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

        <ul id="project-task-list" class="space-y-1">
          <%= for task <- @tasks do %>
            <.task_item
              task={task}
              selected={@selected_task != nil && @selected_task.id == task.id}
              show_subtasks={true}
              show_notes={true}
              show_priority={true}
              show_due_date={true}
              show_delete={true}
              selectable={true}
            />
          <% end %>
        </ul>

        <%= if Enum.empty?(@tasks) do %>
          <p id="project-empty" class="text-muted-foreground text-sm text-center py-12">No tasks yet</p>
        <% end %>
      </div>

      <%= if @selected_task do %>
        <.live_component
          module={KairosWeb.TaskDetailComponent}
          id="task-detail"
          task={@selected_task}
          current_scope={@current_scope}
        />
      <% end %>
    </Layouts.app>
    """
  end
end
