defmodule KairosWeb.GanttLive do
  use KairosWeb, :live_view

  alias Kairos.{Tasks, Links}

  @impl true
  def mount(_params, _session, socket) do
    user_id = socket.assigns.current_scope.user.id

    if connected?(socket) do
      Phoenix.PubSub.subscribe(Kairos.PubSub, "user:#{user_id}")
    end

    {:ok,
     socket
     |> assign_data()
     |> assign(page_title: "Gantt Chart", active_tab: "gantt")}
  end

  @impl true
  def handle_params(params, _uri, socket) do
    view_mode = Map.get(params, "view", "Week")
    {:noreply, assign(socket, view_mode: view_mode)}
  end

  @impl true
  def handle_info({:tasks_changed, _}, socket) do
    {:noreply, assign_data(socket)}
  end

  @impl true
  def handle_event("task_date_changed", %{"id" => id, "end" => end_date}, socket) do
    user_id = socket.assigns.current_scope.user.id

    case Tasks.get_task(id, user_id) do
      nil ->
        {:noreply, socket}

      task ->
        case Date.from_iso8601(end_date) do
          {:ok, date} ->
            {:ok, _} = Tasks.update_task(task, %{due_date: date})
            Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})

          _ ->
            :ok
        end

        {:noreply, assign_data(socket)}
    end
  end

  defp assign_data(socket) do
    user_id = socket.assigns.current_scope.user.id
    tasks = Tasks.list_tasks(user_id)
    links = Links.list_blocking_links_for_user(user_id)

    gantt_tasks =
      tasks
      |> Enum.map(fn task ->
        start_date = task.due_date || Date.utc_today()
        end_date = Date.add(start_date, 1)

        deps =
          links
          |> Enum.filter(&(&1.to_id == task.id))
          |> Enum.map(& &1.from_id)
          |> Enum.join(", ")

        %{
          id: task.id,
          name: task.title,
          start: Date.to_iso8601(start_date),
          end: Date.to_iso8601(end_date),
          progress: if(task.status == "completed", do: 100, else: 0),
          dependencies: deps
        }
      end)

    assign(socket, gantt_tasks: gantt_tasks)
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app flash={@flash} current_scope={@current_scope} nav_areas={assigns[:nav_areas] || []} nav_projects={assigns[:nav_projects] || []}>
      <div id="gantt-container" class="w-full h-full flex flex-col overflow-hidden">
        <div class="p-4 border-b flex items-center justify-between">
          <h1 class="text-xl font-semibold">Gantt Chart</h1>
          <div class="flex gap-2">
            <button phx-click={JS.dispatch("gantt:view-mode", detail: %{mode: "Day"})} class="px-3 py-1 text-xs border rounded hover:bg-muted">Day</button>
            <button phx-click={JS.dispatch("gantt:view-mode", detail: %{mode: "Week"})} class="px-3 py-1 text-xs border rounded hover:bg-muted">Week</button>
            <button phx-click={JS.dispatch("gantt:view-mode", detail: %{mode: "Month"})} class="px-3 py-1 text-xs border rounded hover:bg-muted">Month</button>
          </div>
        </div>
        
        <div id="gantt-canvas-wrapper" class="flex-1 overflow-auto bg-card" phx-update="ignore">
          <div id="gantt-chart" phx-hook="GanttChart" data-tasks={Jason.encode!(@gantt_tasks)}></div>
        </div>
      </div>
    </Layouts.app>
    """
  end
end
