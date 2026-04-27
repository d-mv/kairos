defmodule KairosWeb.InboxLive do
  use KairosWeb, :live_view

  alias Kairos.Tasks
  import KairosWeb.Components.TaskItem

  @impl true
  def mount(_params, _session, socket) do
    user_id = socket.assigns.current_scope.user.id

    if connected?(socket) do
      Phoenix.PubSub.subscribe(Kairos.PubSub, "user:#{user_id}")
    end

    show_completed = false
    tasks = Tasks.list_inbox(user_id, show_completed: show_completed)

    {:ok, assign(socket, tasks: tasks, new_task_title: "", selected_task: nil, page_title: "Inbox", active_tab: "inbox", show_completed: show_completed)}
  end

  @impl true
  def handle_event("toggle_show_completed", _params, socket) do
    user_id = socket.assigns.current_scope.user.id
    show_completed = !socket.assigns.show_completed
    tasks = Tasks.list_inbox(user_id, show_completed: show_completed)
    {:noreply, assign(socket, show_completed: show_completed, tasks: tasks)}
  end

  @impl true
  def handle_event("create_task", %{"title" => title}, socket) when byte_size(title) > 0 do
    user_id = socket.assigns.current_scope.user.id

    case Tasks.create_task(%{title: String.trim(title), user_id: user_id}) do
      {:ok, _task} ->
        tasks = Tasks.list_inbox(user_id, show_completed: socket.assigns.show_completed)
        broadcast_tasks_changed(user_id)
        {:noreply, assign(socket, tasks: tasks, new_task_title: "")}

      {:error, _changeset} ->
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
  def handle_event("complete_task", %{"id" => id}, socket) do
    user_id = socket.assigns.current_scope.user.id
    task = Tasks.get_task!(id, user_id)

    {:ok, _} = Tasks.complete_task(task)
    broadcast_tasks_changed(user_id)
    Process.send_after(self(), {:hide_completed_task, id}, 2000)

    {:noreply, socket}
  end

  @impl true
  def handle_event("reopen_task", %{"id" => id}, socket) do
    user_id = socket.assigns.current_scope.user.id
    task = Tasks.get_task!(id, user_id)

    {:ok, _} = Tasks.reopen_task(task)
    broadcast_tasks_changed(user_id)

    tasks = Tasks.list_inbox(user_id, show_completed: socket.assigns.show_completed)
    {:noreply, assign(socket, tasks: tasks)}
  end

  @impl true
  def handle_event("delete_task", %{"id" => id}, socket) do
    user_id = socket.assigns.current_scope.user.id
    task = Tasks.get_task!(id, user_id)

    {:ok, _} = Tasks.delete_task(task)
    broadcast_tasks_changed(user_id)

    tasks = Tasks.list_inbox(user_id, show_completed: socket.assigns.show_completed)
    {:noreply, assign(socket, tasks: tasks)}
  end

  @impl true
  def handle_info({:hide_completed_task, id}, socket) do
    tasks = Enum.reject(socket.assigns.tasks, &(&1.id == id))
    {:noreply, assign(socket, tasks: tasks)}
  end

  @impl true
  def handle_info({:tasks_changed, _}, socket) do
    user_id = socket.assigns.current_scope.user.id
    tasks = Tasks.list_inbox(user_id, show_completed: socket.assigns.show_completed)

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
    tasks = Tasks.list_inbox(user_id, show_completed: socket.assigns.show_completed)
    {:noreply, assign(socket, selected_task: nil, tasks: tasks)}
  end

  defp broadcast_tasks_changed(user_id) do
    Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app flash={@flash} current_scope={@current_scope} nav_areas={assigns[:nav_areas] || []} nav_projects={assigns[:nav_projects] || []}>
      <div id="inbox-container" class="w-full py-8 px-4">
        <div class="flex items-center justify-between mb-6">
          <h1 id="inbox-title" class="text-2xl font-semibold">Inbox</h1>
          <button
            id="inbox-toggle-completed"
            phx-click="toggle_show_completed"
            class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <.icon name={if @show_completed, do: "hero-eye-slash", else: "hero-eye"} class="w-4 h-4" />
            <%= if @show_completed, do: "Hide completed", else: "Show completed" %>
          </button>
        </div>

        <form id="inbox-add-form" phx-submit="create_task" class="flex gap-2 mb-6">
          <input
            id="new-task-input"
            type="text"
            name="title"
            value={@new_task_title}
            placeholder="Add a task… (press N)"
            class="flex-1 border rounded px-3 py-2 text-sm"
            autocomplete="off"
            data-shortcut="new-task"
          />
          <button id="add-task-btn" type="submit" class="px-4 py-2 bg-primary text-primary-foreground rounded text-sm">
            Add
          </button>
        </form>

        <ul id="inbox-task-list" class="space-y-1">
          <%= for task <- @tasks do %>
            <.task_item
              task={task}
              selected={@selected_task != nil && @selected_task.id == task.id}
              show_notes={true}
              show_priority={true}
              show_due_date={true}
              show_delete={true}
              selectable={true}
            />
          <% end %>
        </ul>

        <%= if Enum.empty?(@tasks) do %>
          <p id="inbox-empty" class="text-muted-foreground text-sm text-center py-12">Inbox is empty</p>
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
