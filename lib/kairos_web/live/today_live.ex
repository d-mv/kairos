defmodule KairosWeb.TodayLive do
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
    tasks = Tasks.list_today(user_id, show_completed: show_completed)
    {:ok, assign(socket, tasks: tasks, page_title: "Today", active_tab: "today", show_completed: show_completed)}
  end

  @impl true
  def handle_event("toggle_show_completed", _params, socket) do
    user_id = socket.assigns.current_scope.user.id
    show_completed = !socket.assigns.show_completed
    tasks = Tasks.list_today(user_id, show_completed: show_completed)
    {:noreply, assign(socket, show_completed: show_completed, tasks: tasks)}
  end

  @impl true
  def handle_event("complete_task", %{"id" => id}, socket) do
    user_id = socket.assigns.current_scope.user.id
    task = Tasks.get_task!(id, user_id)
    {:ok, _} = Tasks.complete_task(task)
    Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
    {:noreply, assign(socket, tasks: Tasks.list_today(user_id, show_completed: socket.assigns.show_completed))}
  end

  def handle_event("reopen_task", %{"id" => id}, socket) do
    user_id = socket.assigns.current_scope.user.id
    task = Tasks.get_task!(id, user_id)
    {:ok, _} = Tasks.reopen_task(task)
    Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
    {:noreply, assign(socket, tasks: Tasks.list_today(user_id, show_completed: socket.assigns.show_completed))}
  end

  @impl true
  def handle_info({:tasks_changed, _}, socket) do
    user_id = socket.assigns.current_scope.user.id
    {:noreply, assign(socket, tasks: Tasks.list_today(user_id, show_completed: socket.assigns.show_completed))}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app flash={@flash} current_scope={@current_scope} nav_areas={assigns[:nav_areas] || []} nav_projects={assigns[:nav_projects] || []}>
      <div id="today-container" class="w-full py-8 px-4">
        <div class="flex items-center justify-between mb-6">
          <h1 id="today-title" class="text-2xl font-semibold">Today</h1>
          <button
            id="today-toggle-completed"
            phx-click="toggle_show_completed"
            class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <.icon name={if @show_completed, do: "hero-eye-slash", else: "hero-eye"} class="w-4 h-4" />
            <%= if @show_completed, do: "Hide completed", else: "Show completed" %>
          </button>
        </div>
        <ul id="today-task-list" class="space-y-1">
          <%= for task <- @tasks do %>
            <.task_item task={task} show_due_time={true} />
          <% end %>
        </ul>
        <%= if Enum.empty?(@tasks) do %>
          <p id="today-empty" class="text-muted-foreground text-sm text-center py-12">Nothing due today</p>
        <% end %>
      </div>
    </Layouts.app>
    """
  end
end
