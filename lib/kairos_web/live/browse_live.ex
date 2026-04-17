defmodule KairosWeb.BrowseLive do
  use KairosWeb, :live_view

  alias Kairos.{Areas, Projects}

  @impl true
  def mount(_params, _session, socket) do
    if connected?(socket) do
      # Subscribe to updates if needed, though SidebarComponent usually handles broadcasts
      # For simplicity in Browse view, we refetch or use standard Sidebar logic
    end

    {:ok, assign(socket, page_title: "Browse", active_tab: "browse")}
  end

  @impl true
  def handle_params(_params, _url, socket) do
    {:noreply, socket}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app flash={@flash} current_scope={@current_scope} nav_areas={assigns[:nav_areas] || []} nav_projects={assigns[:nav_projects] || []}>
      <div id="browse-container" class="w-full py-6 px-4 space-y-8">
        <h1 class="text-2xl font-semibold">Browse</h1>

        <div class="grid gap-6">
          <section id="browse-areas">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">Areas</h2>
              <button
                phx-click={JS.push("toggle_create_area", target: "#sidebar-component")}
                class="text-primary text-sm font-medium"
              >
                Add Area
              </button>
            </div>

            <div class="space-y-3">
              <%= for area <- @nav_areas do %>
                <div class="flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm">
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
                  <button
                    phx-click={JS.push("toggle_area_menu", value: %{id: area.id}, target: "#sidebar-component")}
                    class="p-2 text-muted-foreground hover:bg-muted rounded-full"
                  >
                    <.icon name="hero-ellipsis-horizontal" class="w-5 h-5" />
                  </button>
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
                phx-click={JS.push("toggle_create_project", value: %{"area-id" => "_none"}, target: "#sidebar-component")}
                class="text-primary text-sm font-medium"
              >
                Add Project
              </button>
            </div>

            <div class="space-y-3">
              <%= for project <- Enum.filter(@nav_projects, &is_nil(&1.area_id)) do %>
                <div class="flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm">
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
            </div>
          </section>
        </div>
      </div>
    </Layouts.app>
    """
  end
end
