defmodule KairosWeb.Components.TaskItem do
  use Phoenix.Component

  import KairosWeb.CoreComponents, only: [icon: 1]

  attr :task, :map, required: true
  attr :selected, :boolean, default: false
  attr :show_checkbox, :boolean, default: true
  attr :show_notes, :boolean, default: false
  attr :show_priority, :boolean, default: true
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

      <%= if @selectable && (@task.url && @task.url != "") do %>
        <a
          id={"task-title-#{@task.id}"}
          href={@task.url}
          target="_blank"
          rel="noopener noreferrer"
          class="flex-1 min-w-0 hover:underline"
        >
          <span class={["text-sm block truncate", @task.status == "completed" && "line-through text-muted-foreground"]}>
            {@task.title}
          </span>
          <%= if @show_notes && @task.notes && @task.notes != "" do %>
            <span id={"task-desc-#{@task.id}"} class="text-xs text-muted-foreground block truncate">{@task.notes}</span>
          <% end %>
        </a>
        <button
          id={"task-detail-btn-#{@task.id}"}
          phx-click={@select_event}
          phx-value-id={@task.id}
          class="opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 shrink-0 text-muted-foreground hover:text-foreground p-1"
          title="Open details"
        >
          <.icon name="hero-information-circle" class="w-4 h-4" />
        </button>
      <% else %>
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
        <span id={"task-due-#{@task.id}"} class="text-xs text-muted-foreground shrink-0">
          {format_due_date(@task.due_date)}<%= if @task.due_time do %> @ {format_due_time(@task.due_time)}<% end %>
        </span>
      <% end %>

      <%= if @show_delete do %>
        <button
          id={"task-delete-#{@task.id}"}
          phx-click={@delete_event}
          phx-value-id={@task.id}
          class="opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
        >
          <.icon name="hero-x-mark" class="w-4 h-4" />
        </button>
      <% end %>
    </li>
    """
  end

  @months ~w(January February March April May June July August September October November December)

  defp format_due_date(%Date{} = date) do
    month = Enum.at(@months, date.month - 1)
    current_year = Date.utc_today().year

    if date.year == current_year do
      "#{month} #{date.day}"
    else
      "#{month} #{date.day}, #{date.year}"
    end
  end

  defp format_due_date(date) when is_binary(date) do
    case Date.from_iso8601(date) do
      {:ok, d} -> format_due_date(d)
      _ -> date
    end
  end

  defp format_due_time(time) when is_binary(time) do
    case String.split(time, ":") do
      [h, m | _] -> "#{h}:#{m}"
      _ -> time
    end
  end

  defp format_due_time(%Time{} = t), do: format_due_time(Time.to_string(t))
end
