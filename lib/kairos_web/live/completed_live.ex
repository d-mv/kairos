defmodule KairosWeb.CompletedLive do
  use KairosWeb, :live_view

  alias Kairos.Tasks

  @impl true
  def mount(_params, _session, socket) do
    user_id = socket.assigns.current_scope.user.id

    if connected?(socket) do
      Phoenix.PubSub.subscribe(Kairos.PubSub, "user:#{user_id}")
    end

    tasks = Tasks.list_completed(user_id)
    {:ok, assign(socket, tasks: tasks, page_title: "Completed")}
  end

  @impl true
  def handle_event("reopen_task", %{"id" => id}, socket) do
    user_id = socket.assigns.current_scope.user.id
    task = Tasks.get_task!(id, user_id)
    {:ok, _} = Tasks.reopen_task(task)
    Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
    {:noreply, assign(socket, tasks: Tasks.list_completed(user_id))}
  end

  @impl true
  def handle_info({:tasks_changed, _}, socket) do
    user_id = socket.assigns.current_scope.user.id
    {:noreply, assign(socket, tasks: Tasks.list_completed(user_id))}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app flash={@flash} current_scope={@current_scope}>
      <div id="completed-container" class="w-full py-8 px-4">
        <h1 id="completed-title" class="text-2xl font-semibold mb-6">Completed</h1>
        <ul id="completed-task-list" class="space-y-1">
          <%= for task <- @tasks do %>
            <li id={"task-#{task.id}"} class="flex items-center gap-3 p-2 rounded hover:bg-muted group">
              <input
                id={"task-checkbox-#{task.id}"}
                type="checkbox"
                checked
                phx-click="reopen_task"
                phx-value-id={task.id}
                class="w-4 h-4 cursor-pointer"
              />
              <span id={"task-title-#{task.id}"} class="flex-1 text-sm line-through text-muted-foreground"><%= task.title %></span>
            </li>
          <% end %>
        </ul>
        <%= if Enum.empty?(@tasks) do %>
          <p id="completed-empty" class="text-muted-foreground text-sm text-center py-12">Nothing completed yet</p>
        <% end %>
      </div>
    </Layouts.app>
    """
  end
end
