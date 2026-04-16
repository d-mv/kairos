defmodule KairosWeb.SearchLive do
  use KairosWeb, :live_view

  alias Kairos.Tasks

  @impl true
  def mount(_params, _session, socket) do
    {:ok, assign(socket, tasks: [], query: "", page_title: "Search")}
  end

  @impl true
  def handle_event("search", %{"query" => query}, socket) do
    user_id = socket.assigns.current_scope.user.id
    query = String.trim(query)

    tasks =
      if String.length(query) >= 2 do
        Tasks.search(user_id, query)
      else
        []
      end

    {:noreply, assign(socket, tasks: tasks, query: query)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app flash={@flash} current_scope={@current_scope}>
      <div id="search-container" class="w-full py-8 px-4">
        <h1 id="search-title" class="text-2xl font-semibold mb-6">Search</h1>

        <form id="search-form" phx-change="search" phx-submit="search" class="mb-6">
          <input
            id="search-input"
            type="text"
            name="query"
            value={@query}
            placeholder="Search tasks… (press /)"
            class="w-full border rounded px-3 py-2 text-sm"
            autocomplete="off"
            phx-debounce="300"
            data-shortcut="search"
          />
        </form>

        <%= if String.length(@query) >= 2 do %>
          <ul id="search-results" class="space-y-1">
            <%= for task <- @tasks do %>
              <li id={"task-#{task.id}"} class="flex items-center gap-3 p-2 rounded hover:bg-muted">
                <span id={"task-title-#{task.id}"} class={["flex-1 text-sm", task.status == "completed" && "line-through text-muted-foreground"]}>
                  <%= task.title %>
                </span>
              </li>
            <% end %>
          </ul>
          <%= if Enum.empty?(@tasks) do %>
            <p id="search-empty" class="text-muted-foreground text-sm text-center py-12">No results for "<%= @query %>"</p>
          <% end %>
        <% end %>
      </div>
    </Layouts.app>
    """
  end
end
