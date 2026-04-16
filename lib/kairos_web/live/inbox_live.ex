defmodule KairosWeb.InboxLive do
  use KairosWeb, :live_view

  alias Kairos.Tasks

  @impl true
  def mount(_params, _session, socket) do
    user_id = socket.assigns.current_scope.user.id

    if connected?(socket) do
      Phoenix.PubSub.subscribe(Kairos.PubSub, "user:#{user_id}")
    end

    tasks = Tasks.list_inbox(user_id)

    {:ok, assign(socket, tasks: tasks, new_task_title: "", selected_task: nil, page_title: "Inbox")}
  end

  @impl true
  def handle_event("create_task", %{"title" => title}, socket) when byte_size(title) > 0 do
    user_id = socket.assigns.current_scope.user.id

    case Tasks.create_task(%{title: String.trim(title), user_id: user_id}) do
      {:ok, _task} ->
        tasks = Tasks.list_inbox(user_id)
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

    tasks = Tasks.list_inbox(user_id)
    {:noreply, assign(socket, tasks: tasks)}
  end

  @impl true
  def handle_event("reopen_task", %{"id" => id}, socket) do
    user_id = socket.assigns.current_scope.user.id
    task = Tasks.get_task!(id, user_id)

    {:ok, _} = Tasks.reopen_task(task)
    broadcast_tasks_changed(user_id)

    tasks = Tasks.list_inbox(user_id)
    {:noreply, assign(socket, tasks: tasks)}
  end

  @impl true
  def handle_event("delete_task", %{"id" => id}, socket) do
    user_id = socket.assigns.current_scope.user.id
    task = Tasks.get_task!(id, user_id)

    {:ok, _} = Tasks.delete_task(task)
    broadcast_tasks_changed(user_id)

    tasks = Tasks.list_inbox(user_id)
    {:noreply, assign(socket, tasks: tasks)}
  end

  @impl true
  def handle_info({:tasks_changed, _}, socket) do
    user_id = socket.assigns.current_scope.user.id
    tasks = Tasks.list_inbox(user_id)

    selected_task =
      case socket.assigns.selected_task do
        nil -> nil
        task -> Enum.find(tasks, &(&1.id == task.id))
      end

    {:noreply, assign(socket, tasks: tasks, selected_task: selected_task)}
  end

  @impl true
  def handle_info({:close_task_detail}, socket) do
    {:noreply, assign(socket, :selected_task, nil)}
  end

  defp broadcast_tasks_changed(user_id) do
    Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app flash={@flash} current_scope={@current_scope} nav_areas={assigns[:nav_areas] || []} nav_projects={assigns[:nav_projects] || []}>
      <div id="inbox-container" class="w-full py-8 px-4">
        <h1 id="inbox-title" class="text-2xl font-semibold mb-6">Inbox</h1>

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
            <li
              id={"task-#{task.id}"}
              class={[
                "flex items-center gap-3 p-2 rounded hover:bg-muted group",
                @selected_task && @selected_task.id == task.id && "bg-muted"
              ]}
            >
              <input
                id={"task-checkbox-#{task.id}"}
                type="checkbox"
                checked={task.status == "completed"}
                phx-click={if task.status == "completed", do: "reopen_task", else: "complete_task"}
                phx-value-id={task.id}
                class="w-4 h-4 cursor-pointer"
              />
              <button
                id={"task-title-#{task.id}"}
                phx-click="select_task"
                phx-value-id={task.id}
                class="flex-1 text-left min-w-0"
              >
                <span class={["text-sm block truncate", task.status == "completed" && "line-through text-muted-foreground"]}>
                  <%= task.title %>
                </span>
                <%= if task.notes && task.notes != "" do %>
                  <span id={"task-desc-#{task.id}"} class="text-xs text-muted-foreground block truncate"><%= task.notes %></span>
                <% end %>
              </button>
              <span
                id={"task-priority-#{task.id}"}
                :if={task.priority != "none"}
                class={[
                  "w-2 h-2 rounded-full shrink-0",
                  task.priority == "high" && "bg-red-500",
                  task.priority == "medium" && "bg-yellow-500",
                  task.priority == "low" && "bg-blue-400"
                ]}
                title={task.priority}
              />
              <%= if task.due_date do %>
                <span id={"task-due-#{task.id}"} class="text-xs text-muted-foreground shrink-0"><%= task.due_date %></span>
              <% end %>
              <button
                id={"task-delete-#{task.id}"}
                phx-click="delete_task"
                phx-value-id={task.id}
                class="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs"
              >
                <.icon name="hero-x-mark" class="w-4 h-4" />
              </button>
            </li>
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
