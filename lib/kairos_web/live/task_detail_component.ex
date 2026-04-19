defmodule KairosWeb.TaskDetailComponent do
  use KairosWeb, :live_component

  alias Kairos.{Tasks, Links, Projects, Areas}

  @impl true
  def update(%{task: task} = assigns, socket) do
    user_id = assigns.current_scope.user.id
    changeset = Tasks.change_task(task)
    links = Links.list_detailed_links_for(task.id, "task", user_id)
    projects = Projects.list_projects(user_id)
    areas = Areas.list_areas(user_id)

    {:ok,
     socket
     |> assign(assigns)
     |> assign(:changeset, changeset)
     |> assign(:editing_title, false)

     |> assign(:links, links)
     |> assign(:link_search_results, [])
     |> assign(:link_search_query, "")
     |> assign(:show_link_search, false)
     |> assign(:new_link_type, "related_to")
     |> assign(:projects, projects)
     |> assign(:areas, areas)}
  end

  @impl true
  def handle_event("close", _params, socket) do
    send(self(), {:close_task_detail})
    {:noreply, socket}
  end

  def handle_event("toggle_link_search", _, socket) do
    {:noreply, assign(socket, show_link_search: !socket.assigns.show_link_search, link_search_results: [])}
  end

  def handle_event("search_links", %{"value" => query}, socket) do
    user_id = socket.assigns.current_scope.user.id
    task_id = socket.assigns.task.id

    tasks = Tasks.search_for_linking(user_id, query, task_id)
    projects = Projects.search_for_linking(user_id, query)

    results =
      Enum.map(tasks, &%{id: &1.id, title: &1.title, type: "task"}) ++
      Enum.map(projects, &%{id: &1.id, title: &1.name, type: "project"})

    {:noreply, assign(socket, link_search_results: results, link_search_query: query)}
  end

  def handle_event("create_link", %{"to_id" => to_id, "to_type" => to_type}, socket) do
    user_id = socket.assigns.current_scope.user.id
    task = socket.assigns.task

    attrs = %{
      from_id: task.id,
      from_type: "task",
      to_id: to_id,
      to_type: to_type,
      link_type: socket.assigns.new_link_type,
      user_id: user_id
    }

    case Links.create_link(attrs) do
      {:ok, _} ->
        links = Links.list_detailed_links_for(task.id, "task", user_id)
        Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
        {:noreply, assign(socket, links: links, show_link_search: false, link_search_results: [])}

      {:error, _} ->
        {:noreply, socket}
    end
  end

  def handle_event("delete_link", %{"id" => id}, socket) do
    user_id = socket.assigns.current_scope.user.id
    task = socket.assigns.task

    case Links.get_link(id, user_id) do
      nil -> {:noreply, socket}
      link ->
        {:ok, _} = Links.delete_link(link)
        links = Links.list_detailed_links_for(task.id, "task", user_id)
        Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
        {:noreply, assign(socket, links: links)}
    end
  end

  def handle_event("set_link_type", %{"type" => type}, socket) do
    {:noreply, assign(socket, new_link_type: type)}
  end

  def handle_event("add_tag", %{"tag" => tag}, socket) do
    task = socket.assigns.task
    user_id = socket.assigns.current_scope.user.id
    new_tag = tag |> String.trim() |> String.downcase()

    if new_tag != "" && new_tag not in (task.tags || []) do
      tags = (task.tags || []) ++ [new_tag]

      case Tasks.update_task(task, %{tags: tags}) do
        {:ok, updated_task} ->
          Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
          {:noreply, assign(socket, :task, updated_task)}

        {:error, _} ->
          {:noreply, socket}
      end
    else
      {:noreply, socket}
    end
  end

  def handle_event("remove_tag", %{"tag" => tag}, socket) do
    task = socket.assigns.task
    user_id = socket.assigns.current_scope.user.id
    tags = (task.tags || []) -- [tag]

    case Tasks.update_task(task, %{tags: tags}) do
      {:ok, updated_task} ->
        Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
        {:noreply, assign(socket, :task, updated_task)}

      {:error, _} ->
        {:noreply, socket}
    end
  end

  def handle_event("edit_title", _params, socket) do
    {:noreply, assign(socket, :editing_title, true)}
  end

  def handle_event("save_title", %{"title" => title}, socket) do
    task = socket.assigns.task
    user_id = socket.assigns.current_scope.user.id

    case Tasks.update_task(task, %{title: String.trim(title)}) do
      {:ok, updated_task} ->
        Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
        {:noreply, socket |> assign(:task, updated_task) |> assign(:editing_title, false)}

      {:error, changeset} ->
        {:noreply, assign(socket, :changeset, changeset)}
    end
  end

  def handle_event("save_field", %{"field" => field, "value" => value}, socket) do
    task = socket.assigns.task
    user_id = socket.assigns.current_scope.user.id
    coerced = if(value == "", do: nil, else: value)
    attrs = %{String.to_existing_atom(field) => coerced}

    case Tasks.update_task(task, attrs) do
      {:ok, updated_task} ->
        Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})

        socket =
          socket
          |> assign(:task, updated_task)


        {:noreply, socket}

      {:error, changeset} ->
        {:noreply, assign(socket, :changeset, changeset)}
    end
  end

  def handle_event("move_task", %{"container" => container}, socket) do
    task = socket.assigns.task
    user_id = socket.assigns.current_scope.user.id

    attrs =
      case container do
        "inbox" -> %{project_id: nil, area_id: nil}
        "project_" <> id -> %{project_id: id, area_id: nil}
        "area_" <> id -> %{project_id: nil, area_id: id}
        _ -> nil
      end

    if attrs do
      case Tasks.update_task(task, attrs) do
        {:ok, _updated_task} ->
          Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
          send(self(), {:close_task_detail})
          {:noreply, socket}

        {:error, _} ->
          {:noreply, socket}
      end
    else
      {:noreply, socket}
    end
  end

  def handle_event("complete", _params, socket) do
    task = socket.assigns.task
    user_id = socket.assigns.current_scope.user.id
    {:ok, updated_task} = Tasks.complete_task(task)
    Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
    {:noreply, assign(socket, :task, updated_task)}
  end

  def handle_event("reopen", _params, socket) do
    task = socket.assigns.task
    user_id = socket.assigns.current_scope.user.id
    {:ok, updated_task} = Tasks.reopen_task(task)
    Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
    {:noreply, assign(socket, :task, updated_task)}
  end




  @impl true
  def render(assigns) do
    ~H"""
    <div
      id={@id}
      class="fixed inset-y-0 right-0 w-96 bg-background border-l border-border shadow-xl flex flex-col z-50"
      phx-click-away="close"
      phx-target={@myself}
    >
      <div id="task-detail-header" class="flex items-center justify-between p-4 border-b">
        <span class="text-sm font-medium text-muted-foreground">Task detail</span>
        <button
          id="task-detail-close"
          phx-click="close"
          phx-target={@myself}
          class="p-1 rounded hover:bg-muted"
        >
          <.icon name="hero-x-mark" class="w-4 h-4" />
        </button>
      </div>

      <div id="task-detail-body" class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- Title with status icon -->
        <div id="task-detail-title-row" class="flex items-center gap-2">
          <%= if @task.status == "completed" do %>
            <button
              id="task-detail-reopen"
              phx-click="reopen"
              phx-target={@myself}
              class="shrink-0 rounded-full text-primary hover:bg-muted"
              title="Mark pending"
            >
              <.icon name="hero-check-circle" class="w-6 h-6" />
            </button>
          <% else %>
            <button
              id="task-detail-complete"
              phx-click="complete"
              phx-target={@myself}
              class="shrink-0 rounded-full hover:bg-muted text-muted-foreground"
              title="Mark complete"
            >
              <.icon name="hero-circle" class="w-6 h-6" />
            </button>
          <% end %>

          <%= if @editing_title do %>
            <form id="task-detail-title-form" phx-submit="save_title" phx-target={@myself} class="flex-1">
              <input
                id="task-detail-title-input"
                type="text"
                name="title"
                value={@task.title}
                class="w-full text-lg font-medium border rounded px-2 py-1 focus:outline-none"
                phx-mounted={JS.focus()}
                phx-blur="save_title"
                phx-target={@myself}
                autocomplete="off"
              />
            </form>
          <% else %>
            <button
              id="task-detail-title"
              phx-click="edit_title"
              phx-target={@myself}
              class="flex-1 text-left text-lg font-medium hover:bg-muted rounded px-2 py-1"
            >
              {@task.title}
            </button>
          <% end %>
        </div>

        <!-- Priority -->
        <div id="task-detail-priority-section">
          <span id="task-detail-priority-label" class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority</span>
          <form id="task-detail-priority-form" phx-change="save_field" phx-target={@myself}>
            <input type="hidden" name="field" value="priority" />
            <select
              id="task-detail-priority"
              name="value"
              class="mt-1 w-full border rounded px-2 py-1 text-sm focus:outline-none bg-background"
            >
              <option value="none" selected={@task.priority == "none"}>None</option>
              <option value="low" selected={@task.priority == "low"}>Low</option>
              <option value="medium" selected={@task.priority == "medium"}>Medium</option>
              <option value="high" selected={@task.priority == "high"}>High</option>
            </select>
          </form>
        </div>

        <!-- Notes -->
        <div id="task-detail-notes-section">
          <span id="task-detail-notes-label" class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</span>
          <form id="task-detail-notes-form" phx-change="save_field" phx-target={@myself}>
            <input type="hidden" name="field" value="notes" />
            <textarea
              id="task-detail-notes"
              name="value"
              phx-debounce="1000"
              class="mt-1 w-full border rounded px-2 py-1 text-sm min-h-24 resize-none focus:outline-none bg-background"
              placeholder="Add notes…"
            >{@task.notes}</textarea>
          </form>
        </div>

        <!-- Tags -->
        <div id="task-detail-tags-section">
          <span id="task-detail-tags-label" class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tags</span>
          <div class="mt-1 flex flex-wrap gap-1 mb-2">
            <%= for tag <- (@task.tags || []) do %>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium border border-primary/20">
                <%= tag %>
                <button phx-click="remove_tag" phx-value-tag={tag} phx-target={@myself} class="hover:text-destructive">
                  <.icon name="hero-x-mark" class="w-3 h-3" />
                </button>
              </span>
            <% end %>
          </div>
          <form id="add-tag-form" phx-submit="add_tag" phx-target={@myself}>
            <input
              id="add-tag-input"
              type="text"
              name="tag"
              placeholder="Add tag…"
              class="w-full border rounded px-2 py-1 text-xs focus:outline-none bg-background"
              autocomplete="off"
            />
          </form>
        </div>

        <!-- Due date + time -->
        <div id="task-detail-due-section">
          <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Due</span>
          <div class="mt-1 flex gap-2">
            <input
              id="task-detail-due-date"
              type="date"
              value={@task.due_date}
              phx-blur="save_field"
              phx-value-field="due_date"
              phx-target={@myself}
              class="flex-1 border rounded px-2 py-1 text-sm focus:outline-none"
            />
            <input
              id="task-detail-due-time"
              type="time"
              value={@task.due_time}
              phx-blur="save_field"
              phx-value-field="due_time"
              phx-target={@myself}
              class="flex-1 border rounded px-2 py-1 text-sm focus:outline-none"
            />
          </div>
        </div>

        <!-- Move to -->
        <div id="task-detail-move-section">
          <span id="task-detail-move-label" class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Move to</span>
          <form id="task-detail-move-form" phx-change="move_task" phx-target={@myself}>
          <select
            id="task-detail-move-select"
            name="container"
            class="mt-1 w-full border rounded px-2 py-1 text-sm focus:outline-none bg-background"
          >
            <option value="inbox" selected={is_nil(@task.project_id) and is_nil(@task.area_id)}>Inbox</option>
            <%= if Enum.any?(@projects) do %>
              <optgroup label="Projects">
                <%= for project <- @projects do %>
                  <option value={"project_#{project.id}"} selected={@task.project_id == project.id}>{project.name}</option>
                <% end %>
              </optgroup>
            <% end %>
            <%= if Enum.any?(@areas) do %>
              <optgroup label="Areas">
                <%= for area <- @areas do %>
                  <option value={"area_#{area.id}"} selected={@task.area_id == area.id}>{area.name}</option>
                <% end %>
              </optgroup>
            <% end %>
          </select>
          </form>
        </div>

        <!-- Links -->
        <div id="task-detail-links-section" class="pt-4 border-t">
          <div class="flex items-center justify-between mb-2">
            <span id="task-detail-links-label" class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Links</span>
            <button
              id="task-detail-add-link"
              phx-click="toggle_link_search"
              phx-target={@myself}
              class="text-xs font-medium text-primary hover:underline"
            >
              <%= if @show_link_search, do: "Cancel", else: "Add link" %>
            </button>
          </div>

          <%= if @show_link_search do %>
            <div id="link-search-container" class="space-y-3 mb-4 p-3 bg-muted/30 rounded-lg border border-border">
              <div class="flex gap-1">
                <%= for type <- ~w(blocks blocked_by related_to) do %>
                  <button
                    phx-click="set_link_type"
                    phx-value-type={type}
                    phx-target={@myself}
                    class={["px-2 py-1 text-[10px] rounded border transition-colors capitalize", 
                           if(@new_link_type == type, do: "bg-primary text-primary-foreground border-primary", else: "bg-background text-muted-foreground border-border")]}
                  >
                    <%= String.replace(type, "_", " ") %>
                  </button>
                <% end %>
              </div>
              <input
                id="link-search-input"
                type="text"
                name="query"
                placeholder="Search tasks or projects…"
                class="w-full text-sm border rounded px-2 py-1.5 focus:outline-none bg-background"
                phx-keyup="search_links"
                phx-target={@myself}
                phx-mounted={JS.focus()}
                autocomplete="off"
              />
              <div id="link-search-results" class="max-h-40 overflow-y-auto space-y-1">
                <%= for result <- @link_search_results do %>
                  <button
                    phx-click="create_link"
                    phx-value-to_id={result.id}
                    phx-value-to_type={result.type}
                    phx-target={@myself}
                    class="w-full text-left p-2 text-xs hover:bg-muted rounded flex items-center gap-2 border border-transparent hover:border-border"
                  >
                    <.icon name={if result.type == "task", do: "hero-circle", else: "hero-folder"} class="w-3 h-3 text-muted-foreground" />
                    <span class="truncate flex-1"><%= result.title %></span>
                    <span class="text-[10px] text-muted-foreground uppercase opacity-60"><%= result.type %></span>
                  </button>
                <% end %>
                <%= if @link_search_query != "" && Enum.empty?(@link_search_results) do %>
                  <div class="text-[10px] text-muted-foreground text-center py-2">No matches found</div>
                <% end %>
              </div>
            </div>
          <% end %>

          <div id="active-links-list" class="space-y-2">
            <%= for link <- @links do %>
              <div id={"link-#{link.id}"} class="flex items-center justify-between group p-2 hover:bg-muted/50 rounded transition-colors border border-transparent hover:border-border">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5 mb-0.5">
                    <span class="text-[10px] font-bold uppercase tracking-tighter text-primary/80"><%= String.replace(link.link_type, "_", " ") %></span>
                    <.icon name={if link.target_type == "task", do: "hero-circle", else: "hero-folder"} class="w-3 h-3 text-muted-foreground" />
                  </div>
                  <.link navigate={if link.target_type == "task", do: ~p"/inbox", else: ~p"/projects/#{link.target_id}"} class="text-xs font-medium hover:underline block truncate">
                    <%= link.target_title %>
                  </.link>
                </div>
                <button
                  phx-click="delete_link"
                  phx-value-id={link.id}
                  phx-target={@myself}
                  class="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  title="Remove link"
                >
                  <.icon name="hero-x-mark" class="w-3.5 h-3.5" />
                </button>
              </div>
            <% end %>
          </div>
        </div>

        <!-- Timestamps -->
        <div id="task-detail-timestamps" class="text-xs text-muted-foreground space-y-1 pt-4 border-t">
          <div id="task-detail-created">Created: {Calendar.strftime(@task.inserted_at, "%b %d, %Y")}</div>
          <div id="task-detail-updated">Updated: {Calendar.strftime(@task.updated_at, "%b %d, %Y")}</div>
        </div>
      </div>
    </div>
    """
  end
end
