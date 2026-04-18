defmodule KairosWeb.Components.TaskItem do
  use Phoenix.Component

  import KairosWeb.CoreComponents, only: [icon: 1]

  attr :task, :map, required: true
  attr :selected, :boolean, default: false
  attr :show_checkbox, :boolean, default: true
  attr :show_notes, :boolean, default: false
  attr :show_priority, :boolean, default: false
  attr :show_due_date, :boolean, default: false
  attr :show_due_time, :boolean, default: false
  attr :show_subtasks, :boolean, default: false
  attr :show_delete, :boolean, default: false
  attr :selectable, :boolean, default: false
  attr :complete_event, :string, default: "complete_task"
  attr :reopen_event, :string, default: "reopen_task"
  attr :select_event, :string, default: "select_task"
  attr :delete_event, :string, default: "delete_task"

  def task_item(assigns) do
    ~H"""
    <li
      id={"task-#{@task.id}"}
      data-selected={to_string(@selected)}
      class={[
        "flex items-center gap-3 p-2 rounded hover:bg-muted group",
        @selected && "bg-muted"
      ]}
    >
      <%= if @show_checkbox do %>
        <input
          id={"task-checkbox-#{@task.id}"}
          type="checkbox"
          checked={@task.status == "completed"}
          phx-click={if @task.status == "completed", do: @reopen_event, else: @complete_event}
          phx-value-id={@task.id}
          class="w-4 h-4 cursor-pointer shrink-0"
        />
      <% end %>

      <%= if @selectable do %>
        <button
          id={"task-title-#{@task.id}"}
          phx-click={@select_event}
          phx-value-id={@task.id}
          data-shortcut="edit-task"
          class="flex-1 text-left min-w-0"
        >
          <span class={["text-sm block truncate", @task.status == "completed" && "line-through text-muted-foreground"]}>
            {@task.title}
          </span>
          <%= if @show_notes && @task.notes && @task.notes != "" do %>
            <span id={"task-desc-#{@task.id}"} class="text-xs text-muted-foreground block truncate">{@task.notes}</span>
          <% end %>
        </button>
      <% else %>
        <div id={"task-title-#{@task.id}"} class="flex-1 min-w-0">
          <span class={["text-sm block truncate", @task.status == "completed" && "line-through text-muted-foreground"]}>
            {@task.title}
          </span>
          <%= if @show_notes && @task.notes && @task.notes != "" do %>
            <span id={"task-desc-#{@task.id}"} class="text-xs text-muted-foreground block truncate">{@task.notes}</span>
          <% end %>
        </div>
      <% end %>

      <%= if @show_subtasks && @task.subtasks != [] do %>
        <span id={"task-subtask-count-#{@task.id}"} class="text-xs text-muted-foreground shrink-0">
          {length(@task.subtasks)} subtasks
        </span>
      <% end %>

      <span
        id={"task-priority-#{@task.id}"}
        :if={@show_priority && @task.priority != "none"}
        class={[
          "w-2 h-2 rounded-full shrink-0",
          @task.priority == "high" && "bg-red-500",
          @task.priority == "medium" && "bg-yellow-500",
          @task.priority == "low" && "bg-blue-400"
        ]}
        title={@task.priority}
      />

      <%= if @show_due_date && @task.due_date do %>
        <span id={"task-due-#{@task.id}"} class="text-xs text-muted-foreground shrink-0">{@task.due_date}</span>
      <% end %>

      <%= if @show_due_time && @task.due_time do %>
        <span id={"task-time-#{@task.id}"} class="text-xs text-muted-foreground shrink-0">{@task.due_time}</span>
      <% end %>

      <%= if @show_delete do %>
        <button
          id={"task-delete-#{@task.id}"}
          phx-click={@delete_event}
          phx-value-id={@task.id}
          class="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
        >
          <.icon name="hero-x-mark" class="w-4 h-4" />
        </button>
      <% end %>
    </li>
    """
  end
end
