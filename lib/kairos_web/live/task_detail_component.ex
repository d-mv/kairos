defmodule KairosWeb.TaskDetailComponent do
  use KairosWeb, :live_component

  alias Kairos.Tasks

  @impl true
  def update(%{task: task} = assigns, socket) do
    changeset = Tasks.change_task(task)

    {:ok,
     socket
     |> assign(assigns)
     |> assign(:changeset, changeset)
     |> assign(:editing_title, false)}
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
    attrs = %{String.to_existing_atom(field) => if(value == "", do: nil, else: value)}

    case Tasks.update_task(task, attrs) do
      {:ok, updated_task} ->
        Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
        {:noreply, assign(socket, :task, updated_task)}

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
  def render(assigns) do
    ~H"""
    <div
      id={@id}
      class="fixed inset-y-0 right-0 w-96 bg-background border-l border-border shadow-xl flex flex-col z-50"
      phx-click-away="close"
      phx-target={@myself}
    >
      <div class="flex items-center justify-between p-4 border-b">
        <span class="text-sm font-medium text-muted-foreground">Task detail</span>
        <button
          phx-click="close"
          phx-target={@myself}
          class="p-1 rounded hover:bg-muted"
        >
          <.icon name="hero-x-mark" class="w-4 h-4" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- Status toggle -->
        <div class="flex items-center gap-2">
          <%= if @task.status == "completed" do %>
            <button
              phx-click="reopen"
              phx-target={@myself}
              class="p-1 rounded-full text-primary hover:bg-muted"
            >
              <.icon name="hero-check-circle" class="w-5 h-5" />
            </button>
            <span class="text-sm text-muted-foreground">Completed</span>
          <% else %>
            <button
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
          <form phx-submit="save_title" phx-target={@myself}>
            <input
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
            phx-click="edit_title"
            phx-target={@myself}
            class="w-full text-left text-lg font-medium hover:bg-muted rounded px-2 py-1"
          >
            {@task.title}
          </button>
        <% end %>

        <!-- Notes -->
        <div>
          <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</label>
          <textarea
            phx-blur="save_field"
            phx-value-field="notes"
            phx-target={@myself}
            class="mt-1 w-full border rounded px-2 py-1 text-sm min-h-24 resize-none focus:outline-none"
            placeholder="Add notes…"
          >{@task.notes}</textarea>
        </div>

        <!-- Due date -->
        <div>
          <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Due date</label>
          <input
            type="date"
            value={@task.due_date}
            phx-blur="save_field"
            phx-value-field="due_date"
            phx-target={@myself}
            class="mt-1 w-full border rounded px-2 py-1 text-sm focus:outline-none"
          />
        </div>

        <!-- Due time -->
        <div>
          <label class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Due time</label>
          <input
            type="time"
            value={@task.due_time}
            phx-blur="save_field"
            phx-value-field="due_time"
            phx-target={@myself}
            class="mt-1 w-full border rounded px-2 py-1 text-sm focus:outline-none"
          />
        </div>

        <!-- Timestamps -->
        <div class="text-xs text-muted-foreground space-y-1 pt-4 border-t">
          <div>Created: {Calendar.strftime(@task.inserted_at, "%b %d, %Y")}</div>
          <div>Updated: {Calendar.strftime(@task.updated_at, "%b %d, %Y")}</div>
        </div>
      </div>
    </div>
    """
  end
end
