defmodule KairosWeb.ProjectLive do
  use KairosWeb, :live_view

  alias Kairos.{Projects, Tasks, Links}
  import KairosWeb.Components.TaskItem

  @impl true
  def mount(%{"id" => id}, _session, socket) do
    user_id = socket.assigns.current_scope.user.id

    if connected?(socket) do
      Phoenix.PubSub.subscribe(Kairos.PubSub, "user:#{user_id}")
    end

    project = Projects.get_project!(id, user_id)
    tasks = Tasks.list_for_project(id, user_id, show_completed: project.show_completed)
    today = Date.utc_today()
    calendar_month = %Date{year: today.year, month: today.month, day: 1}

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
       active_tab: "browse",
       view: "tasks",
       calendar_month: calendar_month,
       gantt_tasks: []
     )}
  end

  @impl true
  def handle_params(params, _uri, socket) do
    view = params["view"] || "tasks"

    socket =
      case view do
        "gantt" -> assign_gantt_data(assign(socket, view: view))
        _ -> assign(socket, view: view)
      end

    {:noreply, socket}
  end

  @impl true
  def handle_event("switch_view", %{"view" => view}, socket) do
    {:noreply, push_patch(socket, to: ~p"/projects/#{socket.assigns.project.id}?view=#{view}")}
  end

  @impl true
  def handle_event("prev_month", _params, socket) do
    m = socket.assigns.calendar_month
    new_month = Date.add(m, -1) |> then(&%Date{year: &1.year, month: &1.month, day: 1})
    {:noreply, assign(socket, calendar_month: new_month)}
  end

  @impl true
  def handle_event("next_month", _params, socket) do
    m = socket.assigns.calendar_month
    new_month =
      Date.add(m, Date.days_in_month(m)) |> then(&%Date{year: &1.year, month: &1.month, day: 1})

    {:noreply, assign(socket, calendar_month: new_month)}
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

        {:noreply, assign_gantt_data(socket)}
    end
  end

  @impl true
  def handle_event("create_task", %{"title" => title}, socket) when byte_size(title) > 0 do
    user_id = socket.assigns.current_scope.user.id
    project_id = socket.assigns.project.id

    case Tasks.create_task(%{title: String.trim(title), user_id: user_id, project_id: project_id}) do
      {:ok, _} ->
        tasks =
          Tasks.list_for_project(project_id, user_id,
            show_completed: socket.assigns.project.show_completed
          )

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

    tasks =
      Tasks.list_for_project(socket.assigns.project.id, user_id,
        show_completed: socket.assigns.project.show_completed
      )

    {:noreply, assign(socket, tasks: tasks)}
  end

  @impl true
  def handle_event("complete_task", %{"id" => id}, socket) do
    user_id = socket.assigns.current_scope.user.id
    task = Tasks.get_task!(id, user_id)
    {:ok, _} = Tasks.complete_task(task)
    Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})

    unless socket.assigns.project.show_completed do
      Process.send_after(self(), {:hide_completed_task, id}, 2000)
    end

    {:noreply, socket}
  end

  def handle_event("reopen_task", %{"id" => id}, socket) do
    user_id = socket.assigns.current_scope.user.id
    task = Tasks.get_task!(id, user_id)
    {:ok, _} = Tasks.reopen_task(task)
    Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})

    tasks =
      Tasks.list_for_project(socket.assigns.project.id, user_id,
        show_completed: socket.assigns.project.show_completed
      )

    {:noreply, assign(socket, tasks: tasks)}
  end

  def handle_event("toggle_show_completed", _params, socket) do
    {:ok, project} = Projects.toggle_show_completed(socket.assigns.project)
    user_id = socket.assigns.current_scope.user.id
    tasks = Tasks.list_for_project(project.id, user_id, show_completed: project.show_completed)
    {:noreply, assign(socket, project: project, tasks: tasks, header_menu_open: false)}
  end

  @impl true
  def handle_event("toggle_header_menu", _params, socket) do
    {:noreply,
     assign(socket,
       header_menu_open: !socket.assigns.header_menu_open,
       confirm_delete: nil,
       confirm_demote: false,
       demote_error: nil
     )}
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
        {:noreply,
         assign(socket, project: updated_project, renaming: false, page_title: updated_project.name)}

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
           demote_error:
             "Cannot demote: some tasks in this project have subtasks. Remove subtasks first."
         )}
    end
  end

  def handle_event("cancel_demote", _params, socket) do
    {:noreply, assign(socket, confirm_demote: false, demote_error: nil)}
  end

  @impl true
  def handle_info({:tasks_changed, _}, socket) do
    user_id = socket.assigns.current_scope.user.id

    tasks =
      Tasks.list_for_project(socket.assigns.project.id, user_id,
        show_completed: socket.assigns.project.show_completed
      )

    selected_task =
      case socket.assigns.selected_task do
        nil -> nil
        task -> Enum.find(tasks, &(&1.id == task.id))
      end

    socket = assign(socket, tasks: tasks, selected_task: selected_task)

    socket =
      if socket.assigns.view == "gantt", do: assign_gantt_data(socket), else: socket

    {:noreply, socket}
  end

  @impl true
  def handle_info({:close_task_detail}, socket) do
    user_id = socket.assigns.current_scope.user.id

    tasks =
      Tasks.list_for_project(socket.assigns.project.id, user_id,
        show_completed: socket.assigns.project.show_completed
      )

    {:noreply, assign(socket, selected_task: nil, tasks: tasks)}
  end

  @impl true
  def handle_info({:hide_completed_task, id}, socket) do
    tasks = Enum.reject(socket.assigns.tasks, &(&1.id == id))
    {:noreply, assign(socket, tasks: tasks)}
  end

  defp assign_gantt_data(socket) do
    user_id = socket.assigns.current_scope.user.id
    tasks = socket.assigns.tasks
    task_ids = MapSet.new(tasks, & &1.id)

    links =
      Links.list_blocking_links_for_user(user_id)
      |> Enum.filter(
        &(MapSet.member?(task_ids, &1.from_id) && MapSet.member?(task_ids, &1.to_id))
      )

    gantt_tasks =
      Enum.map(tasks, fn task ->
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

  defp calendar_weeks(month, tasks) do
    last_day = Date.days_in_month(month)
    last = %Date{year: month.year, month: month.month, day: last_day}
    start_dow = Date.day_of_week(month)
    end_dow = Date.day_of_week(last)
    grid_start = Date.add(month, -(start_dow - 1))
    grid_end = Date.add(last, 7 - end_dow)
    total_days = Date.diff(grid_end, grid_start) + 1

    tasks_by_date = Enum.group_by(tasks, & &1.due_date)

    0..(total_days - 1)
    |> Enum.map(&Date.add(grid_start, &1))
    |> Enum.chunk_every(7)
    |> Enum.map(fn week ->
      Enum.map(week, fn date ->
        {date, Map.get(tasks_by_date, date, [])}
      end)
    end)
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app flash={@flash} current_scope={@current_scope} nav_areas={assigns[:nav_areas] || []} nav_projects={assigns[:nav_projects] || []}>
      <div id="project-container" class="w-full py-8 px-4">
        <!-- Header -->
        <div id="project-header" class="flex items-center gap-2 mb-4">
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
                    id="project-menu-show-completed"
                    phx-click="toggle_show_completed"
                    class="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <.icon name={if @project.show_completed, do: "hero-eye-slash", else: "hero-eye"} class="w-4 h-4" />
                    <%= if @project.show_completed, do: "Hide completed", else: "Show completed" %>
                  </button>
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

        <!-- View tabs -->
        <div id="project-view-tabs" class="flex gap-1 mb-6 border-b border-border">
          <button
            id="project-tab-tasks"
            phx-click="switch_view"
            phx-value-view="tasks"
            class={"px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors " <> if @view == "tasks", do: "border-primary text-primary", else: "border-transparent text-muted-foreground hover:text-foreground"}
          >
            Tasks
          </button>
          <button
            id="project-tab-calendar"
            phx-click="switch_view"
            phx-value-view="calendar"
            class={"px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors " <> if @view == "calendar", do: "border-primary text-primary", else: "border-transparent text-muted-foreground hover:text-foreground"}
          >
            Calendar
          </button>
          <button
            id="project-tab-gantt"
            phx-click="switch_view"
            phx-value-view="gantt"
            class={"px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors " <> if @view == "gantt", do: "border-primary text-primary", else: "border-transparent text-muted-foreground hover:text-foreground"}
          >
            Gantt
          </button>
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

        <!-- Tasks view -->
        <%= if @view == "tasks" do %>
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
        <% end %>

        <!-- Calendar view -->
        <%= if @view == "calendar" do %>
          <%
            weeks = calendar_weeks(@calendar_month, @tasks)
            month_label = Calendar.strftime(@calendar_month, "%B %Y")
            today = Date.utc_today()
          %>
          <div id="project-calendar" class="select-none">
            <!-- Month navigation -->
            <div id="calendar-nav" class="flex items-center justify-between mb-4">
              <button id="calendar-prev" phx-click="prev_month" class="p-1 rounded hover:bg-muted text-muted-foreground">
                <.icon name="hero-chevron-left" class="w-5 h-5" />
              </button>
              <span id="calendar-month-label" class="font-medium text-sm"><%= month_label %></span>
              <button id="calendar-next" phx-click="next_month" class="p-1 rounded hover:bg-muted text-muted-foreground">
                <.icon name="hero-chevron-right" class="w-5 h-5" />
              </button>
            </div>

            <!-- Day headers -->
            <div class="grid grid-cols-7 mb-1">
              <%= for day <- ~w(Mon Tue Wed Thu Fri Sat Sun) do %>
                <div class="text-center text-xs text-muted-foreground py-1 font-medium"><%= day %></div>
              <% end %>
            </div>

            <!-- Weeks -->
            <div id="calendar-grid" class="grid grid-cols-7 border-l border-t border-border">
              <%= for week <- weeks do %>
                <%= for {date, day_tasks} <- week do %>
                  <%
                    in_month = date.month == @calendar_month.month
                    is_today = date == today
                  %>
                  <div
                    id={"calendar-day-#{date}"}
                    class={"border-r border-b border-border min-h-20 p-1 " <> if(in_month, do: "bg-background", else: "bg-muted/20")}
                  >
                    <div class={"text-xs mb-1 w-6 h-6 flex items-center justify-center rounded-full " <>
                      cond do
                        is_today -> "bg-primary text-primary-foreground font-semibold"
                        in_month -> "text-foreground"
                        true -> "text-muted-foreground"
                      end}>
                      <%= date.day %>
                    </div>
                    <div class="space-y-0.5">
                      <%= for task <- Enum.take(day_tasks, 3) do %>
                        <button
                          phx-click="select_task"
                          phx-value-id={task.id}
                          class={"w-full text-left text-xs px-1 py-0.5 rounded truncate " <>
                            if task.status == "completed",
                              do: "line-through text-muted-foreground",
                              else: "hover:bg-muted text-foreground"}
                        >
                          <%= task.title %>
                        </button>
                      <% end %>
                      <%= if length(day_tasks) > 3 do %>
                        <div class="text-xs text-muted-foreground px-1">+<%= length(day_tasks) - 3 %> more</div>
                      <% end %>
                    </div>
                  </div>
                <% end %>
              <% end %>
            </div>
          </div>
        <% end %>

        <!-- Gantt view -->
        <%= if @view == "gantt" do %>
          <div id="project-gantt" class="flex flex-col gap-3">
            <div class="flex gap-2 justify-end">
              <button phx-click={JS.dispatch("gantt:view-mode", detail: %{mode: "Day"})} class="px-3 py-1 text-xs border rounded hover:bg-muted">Day</button>
              <button phx-click={JS.dispatch("gantt:view-mode", detail: %{mode: "Week"})} class="px-3 py-1 text-xs border rounded hover:bg-muted">Week</button>
              <button phx-click={JS.dispatch("gantt:view-mode", detail: %{mode: "Month"})} class="px-3 py-1 text-xs border rounded hover:bg-muted">Month</button>
            </div>
            <div id="project-gantt-canvas-wrapper" class="overflow-auto" phx-update="ignore">
              <div id="project-gantt-chart" phx-hook="GanttChart" data-tasks={Jason.encode!(@gantt_tasks)}></div>
            </div>
            <%= if Enum.empty?(@gantt_tasks) do %>
              <p class="text-muted-foreground text-sm text-center py-12">No tasks to display in Gantt</p>
            <% end %>
          </div>
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

    <style>
      .gantt .grid-header { fill: hsl(var(--muted-foreground) / 0.05); stroke: hsl(var(--border)); }
      .gantt .grid-row { fill: transparent; }
      .gantt .grid-row:nth-child(even) { fill: hsl(var(--muted) / 0.3); }
      .gantt .bar { fill: hsl(var(--primary)); }
      .gantt .bar-progress { fill: hsl(var(--primary) / 0.7); }
      .gantt .bar-label { fill: hsl(var(--foreground)); font-size: 12px; }
      .gantt .handle { fill: hsl(var(--primary-foreground)); }
      .gantt-container { background: transparent; }
      svg.gantt { background: transparent; }
    </style>
    """
  end
end
