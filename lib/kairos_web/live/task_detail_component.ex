defmodule KairosWeb.TaskDetailComponent do
  use KairosWeb, :live_component

  alias Kairos.Tasks
  alias Kairos.UrlParser

  @impl true
  def update(%{task: task} = assigns, socket) do
    changeset = Tasks.change_task(task)

    {:ok,
     socket
     |> assign(assigns)
     |> assign(:changeset, changeset)
     |> assign(:editing_title, false)
     |> assign(:url_metadata, nil)}
  end

  @impl true
  def handle_event("close", _params, socket) do
    send(self(), {:close_task_detail})
    {:noreply, socket}
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
          |> maybe_fetch_url_metadata(field, coerced)

        {:noreply, socket}

      {:error, changeset} ->
        {:noreply, assign(socket, :changeset, changeset)}
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
  def handle_async(:fetch_url_metadata, {:ok, metadata}, socket) do
    {:noreply, assign(socket, :url_metadata, metadata)}
  end

  def handle_async(:fetch_url_metadata, {:exit, _reason}, socket) do
    {:noreply, socket}
  end

  defp maybe_fetch_url_metadata(socket, "url", nil) do
    assign(socket, :url_metadata, nil)
  end

  defp maybe_fetch_url_metadata(socket, "url", url) do
    start_async(socket, :fetch_url_metadata, fn -> fetch_metadata(url) end)
  end

  defp maybe_fetch_url_metadata(socket, _field, _value), do: socket

  defp fetch_metadata(url) do
    case UrlParser.fetch_metadata(url) do
      {:ok, metadata} -> metadata
      {:error, _} -> %{title: nil, service: nil}
    end
  end

  defp service_label(nil), do: nil
  defp service_label(:youtube), do: "YouTube"
  defp service_label(:instagram), do: "Instagram"
  defp service_label(:twitter), do: "Twitter / X"
  defp service_label(:github), do: "GitHub"
  defp service_label(:notion), do: "Notion"
  defp service_label(:linear), do: "Linear"

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
        <!-- Status toggle -->
        <div id="task-detail-status" class="flex items-center gap-2">
          <%= if @task.status == "completed" do %>
            <button
              id="task-detail-reopen"
              phx-click="reopen"
              phx-target={@myself}
              class="p-1 rounded-full text-primary hover:bg-muted"
            >
              <.icon name="hero-check-circle" class="w-5 h-5" />
            </button>
            <span class="text-sm text-muted-foreground">Completed</span>
          <% else %>
            <button
              id="task-detail-complete"
              phx-click="complete"
              phx-target={@myself}
              class="p-1 rounded-full hover:bg-muted text-muted-foreground"
            >
              <.icon name="hero-circle" class="w-5 h-5" />
            </button>
            <span class="text-sm text-muted-foreground">Pending</span>
          <% end %>
        </div>

        <!-- Title -->
        <%= if @editing_title do %>
          <form id="task-detail-title-form" phx-submit="save_title" phx-target={@myself}>
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
            class="w-full text-left text-lg font-medium hover:bg-muted rounded px-2 py-1"
          >
            {@task.title}
          </button>
        <% end %>

        <!-- Priority -->
        <div id="task-detail-priority-section">
          <span id="task-detail-priority-label" class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority</span>
          <select
            id="task-detail-priority"
            phx-change="save_field"
            phx-value-field="priority"
            phx-target={@myself}
            name="value"
            class="mt-1 w-full border rounded px-2 py-1 text-sm focus:outline-none bg-background"
          >
            <option value="none" selected={@task.priority == "none"}>None</option>
            <option value="low" selected={@task.priority == "low"}>Low</option>
            <option value="medium" selected={@task.priority == "medium"}>Medium</option>
            <option value="high" selected={@task.priority == "high"}>High</option>
          </select>
        </div>

        <!-- Notes -->
        <div id="task-detail-notes-section">
          <span id="task-detail-notes-label" class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</span>
          <textarea
            id="task-detail-notes"
            phx-blur="save_field"
            phx-value-field="notes"
            phx-target={@myself}
            class="mt-1 w-full border rounded px-2 py-1 text-sm min-h-24 resize-none focus:outline-none"
            placeholder="Add notes…"
          >{@task.notes}</textarea>
        </div>

        <!-- Due date -->
        <div id="task-detail-due-date-section">
          <span id="task-detail-due-date-label" class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Due date</span>
          <input
            id="task-detail-due-date"
            type="date"
            value={@task.due_date}
            phx-blur="save_field"
            phx-value-field="due_date"
            phx-target={@myself}
            class="mt-1 w-full border rounded px-2 py-1 text-sm focus:outline-none"
          />
        </div>

        <!-- Due time -->
        <div id="task-detail-due-time-section">
          <span id="task-detail-due-time-label" class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Due time</span>
          <input
            id="task-detail-due-time"
            type="time"
            value={@task.due_time}
            phx-blur="save_field"
            phx-value-field="due_time"
            phx-target={@myself}
            class="mt-1 w-full border rounded px-2 py-1 text-sm focus:outline-none"
          />
        </div>

        <!-- URL -->
        <div id="task-detail-url-section">
          <span id="task-detail-url-label" class="text-xs font-medium text-muted-foreground uppercase tracking-wide">URL</span>
          <input
            id="task-detail-url"
            type="url"
            value={@task.url}
            phx-blur="save_field"
            phx-value-field="url"
            phx-target={@myself}
            class="mt-1 w-full border rounded px-2 py-1 text-sm focus:outline-none"
            placeholder="https://…"
          />
          <%= if @task.url && @task.url != "" do %>
            <div id="task-detail-url-preview" class="mt-2 flex items-center gap-2 text-sm">
              <a
                id="task-detail-url-link"
                href={@task.url}
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary underline truncate flex-1"
              >
                <%= if @url_metadata && @url_metadata.title do %>
                  {@url_metadata.title}
                <% else %>
                  {@task.url}
                <% end %>
              </a>
              <%= if @url_metadata && @url_metadata.service do %>
                <span id="task-detail-url-service" class="shrink-0 text-xs font-medium bg-muted px-2 py-0.5 rounded">
                  {service_label(@url_metadata.service)}
                </span>
              <% end %>
            </div>
          <% end %>
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
