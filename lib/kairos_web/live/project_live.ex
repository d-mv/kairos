defmodule KairosWeb.ProjectLive do
  use KairosWeb, :live_view

  alias Kairos.{Projects, Tasks}

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
       page_title: project.name
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
  def handle_event("complete_task", %{"id" => id}, socket) do
    user_id = socket.assigns.current_scope.user.id
    task = Tasks.get_task!(id, user_id)
    {:ok, _} = Tasks.complete_task(task)
    Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
    tasks = Tasks.list_for_project(socket.assigns.project.id, user_id)
    {:noreply, assign(socket, tasks: tasks)}
  end

  @impl true
  def handle_info({:tasks_changed, _}, socket) do
    user_id = socket.assigns.current_scope.user.id
    tasks = Tasks.list_for_project(socket.assigns.project.id, user_id)
    {:noreply, assign(socket, tasks: tasks)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app flash={@flash} current_scope={@current_scope}>
      <div class="max-w-2xl mx-auto py-8 px-4">
      <h1 class="text-2xl font-semibold mb-6"><%= @project.name %></h1>

      <form phx-submit="create_task" class="flex gap-2 mb-6">
        <input
          type="text"
          name="title"
          value={@new_task_title}
          placeholder="Add a task…"
          class="flex-1 border rounded px-3 py-2 text-sm"
          autocomplete="off"
        />
        <button type="submit" class="px-4 py-2 bg-primary text-primary-foreground rounded text-sm">Add</button>
      </form>

      <ul class="space-y-1">
        <%= for task <- @tasks do %>
          <li class="flex items-center gap-3 p-2 rounded hover:bg-muted">
            <input
              type="checkbox"
              checked={task.status == "completed"}
              phx-click="complete_task"
              phx-value-id={task.id}
              class="w-4 h-4 cursor-pointer"
            />
            <span class={["flex-1 text-sm", task.status == "completed" && "line-through text-muted-foreground"]}>
              <%= task.title %>
            </span>
            <%= if task.subtasks != [] do %>
              <span class="text-xs text-muted-foreground"><%= length(task.subtasks) %> subtasks</span>
            <% end %>
          </li>
        <% end %>
      </ul>

      <%= if Enum.empty?(@tasks) do %>
        <p class="text-muted-foreground text-sm text-center py-12">No tasks yet</p>
      <% end %>
      </div>
    </Layouts.app>
    """
  end
end
