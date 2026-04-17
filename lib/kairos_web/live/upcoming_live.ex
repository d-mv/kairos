defmodule KairosWeb.UpcomingLive do
  use KairosWeb, :live_view

  alias Kairos.Tasks

  @impl true
  def mount(_params, _session, socket) do
    user_id = socket.assigns.current_scope.user.id

    if connected?(socket) do
      Phoenix.PubSub.subscribe(Kairos.PubSub, "user:#{user_id}")
    end

    tasks = Tasks.list_upcoming(user_id)
    {:ok, assign(socket, tasks: tasks, page_title: "Upcoming", active_tab: "browse")}
  end

  @impl true
  def handle_info({:tasks_changed, _}, socket) do
    user_id = socket.assigns.current_scope.user.id
    {:noreply, assign(socket, tasks: Tasks.list_upcoming(user_id))}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app flash={@flash} current_scope={@current_scope} nav_areas={assigns[:nav_areas] || []} nav_projects={assigns[:nav_projects] || []}>
      <div id="upcoming-container" class="w-full py-8 px-4">
        <h1 id="upcoming-title" class="text-2xl font-semibold mb-6">Upcoming</h1>
        <ul id="upcoming-task-list" class="space-y-1">
          <%= for task <- @tasks do %>
            <li id={"task-#{task.id}"} class="flex items-center gap-3 p-2 rounded hover:bg-muted">
              <span id={"task-title-#{task.id}"} class="flex-1 text-sm"><%= task.title %></span>
              <span id={"task-due-#{task.id}"} class="text-xs text-muted-foreground"><%= task.due_date %></span>
            </li>
          <% end %>
        </ul>
        <%= if Enum.empty?(@tasks) do %>
          <p id="upcoming-empty" class="text-muted-foreground text-sm text-center py-12">No upcoming tasks</p>
        <% end %>
      </div>
    </Layouts.app>
    """
  end
end
