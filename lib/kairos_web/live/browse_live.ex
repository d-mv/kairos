defmodule KairosWeb.BrowseLive do
  use KairosWeb, :live_view

  alias Kairos.{Areas, Projects}

  @impl true
  def mount(_params, _session, socket) do
    user_id = socket.assigns.current_scope.user.id

    if connected?(socket) do
      Phoenix.PubSub.subscribe(Kairos.PubSub, "user:#{user_id}")
    end

    {:ok,
     socket
     |> assign_nav_data(user_id)
     |> assign(
       page_title: "Browse",
       active_tab: "browse",
       creating_area: false,
       creating_project: nil,
       menu_open: nil,
       confirm_delete: nil
     )}
  end

  @impl true
  def handle_params(_params, _url, socket) do
    {:noreply, socket}
  end

  @impl true
  def handle_info({:tasks_changed, _}, socket) do
    user_id = socket.assigns.current_scope.user.id
    {:noreply, assign_nav_data(socket, user_id)}
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

  def handle_event("toggle_menu", %{"id" => id}, socket) do
    open = if socket.assigns.menu_open == id, do: nil, else: id
    {:noreply, assign(socket, menu_open: open, confirm_delete: nil)}
  end

  def handle_event("close_menu", _params, socket) do
    {:noreply, assign(socket, menu_open: nil)}
  end

  def handle_event("confirm_delete_area", %{"id" => id}, socket) do
    area = Enum.find(socket.assigns.nav_areas, &(&1.id == id))
    {:noreply, assign(socket, confirm_delete: {:area, area}, menu_open: nil)}
  end

  def handle_event("confirm_delete_project", %{"id" => id}, socket) do
    project = Enum.find(socket.assigns.nav_projects, &(&1.id == id))
    {:noreply, assign(socket, confirm_delete: {:project, project}, menu_open: nil)}
  end

  def handle_event("delete_confirmed", _, socket) do
    user_id = socket.assigns.current_scope.user.id

    case socket.assigns.confirm_delete do
      {:area, area} -> Areas.delete_area(area)
      {:project, project} -> Projects.delete_project(project)
    end

    Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:tasks_changed, nil})
    {:noreply, assign(socket, confirm_delete: nil)}
  end

  def handle_event("cancel_delete", _, socket) do
    {:noreply, assign(socket, confirm_delete: nil)}
  end

  defp assign_nav_data(socket, user_id) do
    assign(socket,
      nav_areas: Areas.list_areas(user_id),
      nav_projects: Projects.list_projects(user_id)
    )
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app flash={@flash} current_scope={@current_scope} nav_areas={@nav_areas} nav_projects={@nav_projects}>
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
                <div id={"browse-area-#{area.id}"} class="space-y-2 relative">
                  <div class="flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm active:scale-[0.98] transition-transform">
                    <.link navigate={~p"/areas/#{area.id}"} class="flex items-center gap-3 flex-1">
                      <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <.icon name="hero-square-2-stack" class="w-5 h-5" />
                      </div>
                      <div>
                        <div class="font-medium text-foreground"><%= area.name %></div>
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
                        phx-click="toggle_menu"
                        phx-value-id={area.id}
                        class="p-2 text-muted-foreground hover:bg-muted rounded-full"
                      >
                        <.icon name="hero-ellipsis-horizontal" class="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <%= if @menu_open == area.id do %>
                    <div class="absolute right-0 top-14 z-50 w-40 bg-background border border-border rounded-xl shadow-xl py-2" phx-click-away="close_menu">
                      <button phx-click="confirm_delete_area" phx-value-id={area.id} class="w-full text-left px-4 py-2 text-sm text-destructive flex items-center gap-2">
                        <.icon name="hero-trash" class="w-4 h-4" /> Delete
                      </button>
                    </div>
                  <% end %>

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
                <div id={"browse-project-#{project.id}"} class="space-y-2 relative">
                  <div class="flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm active:scale-[0.98] transition-transform">
                    <.link navigate={~p"/projects/#{project.id}"} class="flex items-center gap-3 flex-1">
                      <div class="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                        <.icon name="hero-folder" class="w-5 h-5" />
                      </div>
                      <div>
                        <div class="font-medium text-foreground"><%= project.name %></div>
                        <div class="text-xs text-muted-foreground text-status">Standalone</div>
                      </div>
                    </.link>
                    <button
                      phx-click="toggle_menu"
                      phx-value-id={project.id}
                      class="p-2 text-muted-foreground hover:bg-muted rounded-full"
                    >
                      <.icon name="hero-ellipsis-horizontal" class="w-5 h-5" />
                    </button>
                  </div>

                  <%= if @menu_open == project.id do %>
                    <div class="absolute right-0 top-14 z-50 w-40 bg-background border border-border rounded-xl shadow-xl py-2" phx-click-away="close_menu">
                      <button phx-click="confirm_delete_project" phx-value-id={project.id} class="w-full text-left px-4 py-2 text-sm text-destructive flex items-center gap-2">
                        <.icon name="hero-trash" class="w-4 h-4" /> Delete
                      </button>
                    </div>
                  <% end %>
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

      <%!-- Delete Confirmation Modal --%>
      <%= if @confirm_delete do %>
        <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div class="bg-card w-full max-w-sm p-6 border border-border rounded-2xl shadow-2xl">
            <h3 class="text-lg font-semibold mb-2">Confirm Delete</h3>
            <p class="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this <%= elem(@confirm_delete, 0) %>? This action cannot be undone.
            </p>
            <div class="flex gap-3 justify-end">
              <button phx-click="cancel_delete" class="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg">Cancel</button>
              <button phx-click="delete_confirmed" class="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      <% end %>
    </Layouts.app>
    """
  end
end
