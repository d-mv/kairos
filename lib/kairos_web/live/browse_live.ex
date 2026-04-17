defmodule KairosWeb.BrowseLive do
  use KairosWeb, :live_view

  alias Kairos.{Areas, Projects}

  @impl true
  def mount(_params, _session, socket) do
    if connected?(socket) do
      # Subscribe to updates if needed, though SidebarComponent usually handles broadcasts
      # For simplicity in Browse view, we refetch or use standard Sidebar logic
    end

    {:ok,
     assign(socket,
       page_title: "Browse",
       active_tab: "browse",
       creating_area: false,
       creating_project: nil,
       new_name: ""
     )}
  end

  @impl true
  def handle_params(_params, _url, socket) do
    {:noreply, socket}
  end

  @impl true
  def handle_event("toggle_create_area", _params, socket) do
    {:noreply, assign(socket, creating_area: !socket.assigns.creating_area, creating_project: nil)}
  end

  def handle_event("toggle_create_project", %{"area-id" => area_id}, socket) do
    toggle = if socket.assigns.creating_project == area_id, do: nil, else: area_id
    {:noreply, assign(socket, creating_project: toggle, creating_area: false)}
  end

  def handle_event("cancel", _params, socket) do
    {:noreply, assign(socket, creating_area: false, creating_project: nil)}
  end

  def handle_event("create_area", %{"name" => name}, socket) when byte_size(name) > 0 do
    user_id = socket.assigns.current_scope.user.id

    case Areas.create_area(%{name: String.trim(name), user_id: user_id}) do
      {:ok, _} ->
        Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
        {:noreply, assign(socket, creating_area: false)}

      {:error, _} ->
        {:noreply, socket}
    end
  end

  def handle_event("create_project", %{"name" => name} = params, socket)
      when byte_size(name) > 0 do
    user_id = socket.assigns.current_scope.user.id
    raw_area_id = Map.get(params, "area_id", "")
    area_id = if raw_area_id in ["", "_none"], do: nil, else: raw_area_id

    case Projects.create_project(%{name: String.trim(name), user_id: user_id, area_id: area_id}) do
      {:ok, _} ->
        Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
        {:noreply, assign(socket, creating_project: nil)}

      {:error, _} ->
        {:noreply, socket}
    end
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app flash={@flash} current_scope={@current_scope} nav_areas={assigns[:nav_areas] || []} nav_projects={assigns[:nav_projects] || []}>
      <div id="browse-container" class="w-full py-6 px-4 space-y-8">
        <h1 class="text-2xl font-semibold text-foreground">Browse</h1>

        <div class="grid gap-6">
          <section id="browse-areas">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">Areas</h2>
              <button
                phx-click="toggle_create_area"
                class="text-primary text-sm font-medium"
              >
                <%= if @creating_area, do: "Cancel", else: "Add Area" %>
              </button>
            </div>

            <%= if @creating_area do %>
              <form id="browse-new-area-form" phx-submit="create_area" class="mb-4">
                <input
                  id="browse-new-area-input"
                  type="text"
                  name="name"
                  placeholder="Area name"
                  class="w-full p-4 text-base border-2 border-primary rounded-xl bg-background focus:outline-none shadow-lg"
                  phx-mounted={JS.focus()}
                  phx-keydown="cancel"
                  phx-key="Escape"
                  autocomplete="off"
                />
              </form>
            <% end %>

            <div class="space-y-3">
              <%= for area <- @nav_areas do %>
                <div id={"browse-area-#{area.id}"} class="space-y-2">
                  <div class="flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm active:scale-[0.98] transition-transform">
                    <.link navigate={~p"/areas/#{area.id}"} class="flex items-center gap-3 flex-1">
                      <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <.icon name="hero-square-2-stack" class="w-5 h-5" />
                      </div>
                      <div>
                        <div class="font-medium"><%= area.name %></div>
                        <div class="text-xs text-muted-foreground">
                          <%= Enum.count(Enum.filter(@nav_projects, &(&1.area_id == area.id))) %> projects
                        </div>
                      </div>
                    </.link>
                    <div class="flex items-center gap-2">
                      <button
                        phx-click="toggle_create_project"
                        phx-value-area-id={area.id}
                        class="p-2 text-muted-foreground hover:text-primary"
                      >
                        <.icon name="hero-plus" class="w-5 h-5" />
                      </button>
                      <button
                        phx-click={JS.push("toggle_area_menu", value: %{id: area.id}, target: "#sidebar-component")}
                        class="p-2 text-muted-foreground hover:bg-muted rounded-full"
                      >
                        <.icon name="hero-ellipsis-horizontal" class="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <%= if @creating_project == area.id do %>
                    <form id={"browse-new-project-area-form-#{area.id}"} phx-submit="create_project" class="px-2">
                      <input type="hidden" name="area_id" value={area.id} />
                      <input
                        id={"browse-new-project-input-#{area.id}"}
                        type="text"
                        name="name"
                        placeholder={"Project name in #{area.name}"}
                        class="w-full p-3 text-sm border-2 border-primary rounded-lg bg-background focus:outline-none"
                        phx-mounted={JS.focus()}
                        phx-keydown="cancel"
                        phx-key="Escape"
                        autocomplete="off"
                      />
                    </form>
                  <% end %>
                </div>
              <% end %>

              <%= if Enum.empty?(@nav_areas) do %>
                <div class="text-center py-10 border-2 border-dashed border-border rounded-xl">
                  <p class="text-sm text-muted-foreground">No areas yet.</p>
                </div>
              <% end %>
            </div>
          </section>

          <section id="browse-projects-standalone">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">Standalone Projects</h2>
              <button
                phx-click="toggle_create_project"
                phx-value-area-id="_none"
                class="text-primary text-sm font-medium"
              >
                <%= if @creating_project == "_none", do: "Cancel", else: "Add Project" %>
              </button>
            </div>

            <%= if @creating_project == "_none" do %>
              <form id="browse-new-standalone-project-form" phx-submit="create_project" class="mb-4">
                <input type="hidden" name="area_id" value="_none" />
                <input
                  id="browse-new-standalone-project-input"
                  type="text"
                  name="name"
                  placeholder="Project name"
                  class="w-full p-4 text-base border-2 border-primary rounded-xl bg-background focus:outline-none shadow-lg"
                  phx-mounted={JS.focus()}
                  phx-keydown="cancel"
                  phx-key="Escape"
                  autocomplete="off"
                />
              </form>
            <% end %>

            <div class="space-y-3">
              <%= for project <- Enum.filter(@nav_projects, &is_nil(&1.area_id)) do %>
                <div class="flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm active:scale-[0.98] transition-transform">
                  <.link navigate={~p"/projects/#{project.id}"} class="flex items-center gap-3 flex-1">
                    <div class="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                      <.icon name="hero-folder" class="w-5 h-5" />
                    </div>
                    <div>
                      <div class="font-medium"><%= project.name %></div>
                      <div class="text-xs text-muted-foreground text-status">Standalone</div>
                    </div>
                  </.link>
                  <button
                    phx-click={JS.push("toggle_project_menu", value: %{id: project.id}, target: "#sidebar-component")}
                    class="p-2 text-muted-foreground hover:bg-muted rounded-full"
                  >
                    <.icon name="hero-ellipsis-horizontal" class="w-5 h-5" />
                  </button>
                </div>
              <% end %>

              <%= if Enum.empty?(Enum.filter(@nav_projects, &is_nil(&1.area_id))) do %>
                <div class="text-center py-10 border-2 border-dashed border-border rounded-xl">
                  <p class="text-sm text-muted-foreground">No standalone projects yet.</p>
                </div>
              <% end %>
            </div>
          </section>
        </div>
      </div>
    </Layouts.app>
    """
  end
end
