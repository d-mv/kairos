defmodule KairosWeb.SidebarAreaComponent do
  use KairosWeb, :live_component

  alias Kairos.{Areas, Projects}

  @impl true
  def mount(socket) do
    {:ok,
     assign(socket,
       menu_open: false,
       renaming: false,
       confirm_delete: nil,
       creating_project: false
     )}
  end

  @impl true
  def update(assigns, socket) do
    {:ok, assign(socket, assigns)}
  end

  @impl true
  def handle_event("toggle_menu", _params, socket) do
    {:noreply, assign(socket, menu_open: !socket.assigns.menu_open, confirm_delete: nil)}
  end

  def handle_event("close_menu", _params, socket) do
    {:noreply, assign(socket, menu_open: false)}
  end

  def handle_event("start_rename", _params, socket) do
    {:noreply, assign(socket, renaming: true, menu_open: false)}
  end

  def handle_event("cancel_rename", _params, socket) do
    {:noreply, assign(socket, renaming: false)}
  end

  def handle_event("save_rename", %{"name" => name}, socket) when byte_size(name) > 0 do
    area = socket.assigns.area
    case Areas.update_area(area, %{name: String.trim(name)}) do
      {:ok, _} ->
        send_update(KairosWeb.SidebarComponent, id: "sidebar-component", fetch_data: true)
        {:noreply, assign(socket, renaming: false)}
      {:error, _} ->
        {:noreply, socket}
    end
  end

  def handle_event("save_rename", _params, socket) do
    {:noreply, assign(socket, renaming: false)}
  end

  def handle_event("confirm_delete", _params, socket) do
    area = socket.assigns.area
    task_count = Areas.count_tasks(area.id)
    project_count = Areas.count_projects(area.id)

    {:noreply,
     assign(socket,
       confirm_delete: %{task_count: task_count, project_count: project_count},
       menu_open: false
     )}
  end

  def handle_event("cancel_confirm", _params, socket) do
    {:noreply, assign(socket, confirm_delete: nil)}
  end

  def handle_event("delete_area", _params, socket) do
    area = socket.assigns.area
    {:ok, _} = Areas.delete_area(area)
    send_update(KairosWeb.SidebarComponent, id: "sidebar-component", fetch_data: true)
    {:noreply, assign(socket, confirm_delete: nil)}
  end

  def handle_event("toggle_create_project", _params, socket) do
    {:noreply, assign(socket, creating_project: !socket.assigns.creating_project, menu_open: false)}
  end

  def handle_event("cancel_create_project", _params, socket) do
    {:noreply, assign(socket, creating_project: false)}
  end

  def handle_event("create_project", %{"name" => name}, socket) when byte_size(name) > 0 do
    user_id = socket.assigns.current_scope.user.id
    area_id = socket.assigns.area.id

    case Projects.create_project(%{name: String.trim(name), user_id: user_id, area_id: area_id}) do
      {:ok, _} ->
        send_update(KairosWeb.SidebarComponent, id: "sidebar-component", fetch_data: true)
        {:noreply, assign(socket, creating_project: false)}
      {:error, _} ->
        {:noreply, socket}
    end
  end

  def handle_event("create_project", _params, socket), do: {:noreply, socket}

  @impl true
  def render(assigns) do
    ~H"""
    <div id={"sidebar-area-wrapper-#{@area.id}"} class="space-y-0.5">
      <%= if @renaming do %>
        <form
          id={"sidebar-rename-area-form-#{@area.id}"}
          phx-submit="save_rename"
          phx-target={@myself}
          class="flex items-center gap-1 px-2 py-1"
        >
          <.icon name="hero-square-2-stack" class="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            name="name"
            value={@area.name}
            class="flex-1 text-sm border rounded px-1 py-0.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            phx-mounted={JS.focus()}
            phx-keydown="cancel_rename"
            phx-key="Escape"
            phx-target={@myself}
          />
        </form>
      <% else %>
        <div class="flex items-center rounded hover:bg-muted group/area relative">
          <.link
            id={"sidebar-area-#{@area.id}"}
            navigate={~p"/areas/#{@area.id}"}
            class="flex items-center gap-2 px-2 py-1.5 text-sm flex-1 min-w-0"
          >
            <.icon name="hero-square-2-stack" class="w-4 h-4 text-muted-foreground shrink-0" />
            <span class="flex-1 truncate">{@area.name}</span>
          </.link>
          <div class="flex items-center gap-0.5 pr-1 shrink-0 opacity-0 group-hover/area:opacity-100">
            <button
              id={"sidebar-add-project-to-area-#{@area.id}"}
              phx-click="toggle_create_project"
              phx-target={@myself}
              class="p-0.5 rounded hover:bg-muted text-muted-foreground"
              title="New project in area"
            >
              <.icon name="hero-plus" class="w-6 h-6" />
            </button>
            <div class="relative">
              <button
                id={"sidebar-area-menu-btn-#{@area.id}"}
                phx-click="toggle_menu"
                phx-target={@myself}
                class="p-0.5 rounded hover:bg-muted text-muted-foreground"
                title="Area options"
              >
                <.icon name="hero-ellipsis-horizontal" class="w-6 h-6" />
              </button>
              <%= if @menu_open do %>
                <div
                  id={"sidebar-area-menu-#{@area.id}"}
                  class="absolute right-0 top-full mt-1 z-50 w-36 bg-background border border-border rounded-xl shadow-xl py-1"
                  phx-click-away="close_menu"
                  phx-target={@myself}
                >
                  <button
                    phx-click="start_rename"
                    phx-target={@myself}
                    class="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <.icon name="hero-pencil" class="w-3.5 h-3.5 text-muted-foreground" /> Rename
                  </button>
                  <button
                    phx-click="confirm_delete"
                    phx-target={@myself}
                    class="w-full text-left px-3 py-1.5 text-sm hover:bg-muted text-destructive flex items-center gap-2"
                  >
                    <.icon name="hero-trash" class="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              <% end %>
            </div>
          </div>
        </div>
      <% end %>

      <%= if @creating_project do %>
        <form
          id={"sidebar-new-project-area-form-#{@area.id}"}
          phx-submit="create_project"
          phx-target={@myself}
          class="pl-7 pr-2 pb-1"
        >
          <input
            type="text"
            name="name"
            placeholder="Project name"
            class="w-full text-sm border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            phx-mounted={JS.focus()}
            phx-keydown="cancel_create_project"
            phx-key="Escape"
            phx-target={@myself}
          />
        </form>
      <% end %>

      <%= for project <- @projects do %>
        <.live_component
          module={KairosWeb.SidebarProjectComponent}
          id={"sidebar-project-#{project.id}"}
          project={project}
          indent={true}
          current_scope={@current_scope}
        />
      <% end %>

      <%!-- Confirm Delete Area Modal --%>
      <.modal
        :if={@confirm_delete}
        id={"confirm-delete-area-modal-#{@area.id}"}
        show={true}
        on_cancel={JS.push("cancel_confirm", target: @myself)}
      >
        <div class="text-left">
          <h3 class="text-lg font-semibold leading-6 text-foreground">Delete area</h3>
          <p class="mt-3 text-sm text-muted-foreground">
            Delete area "<%= @area.name %>"?
            <%= if @confirm_delete.task_count > 0 do %>
              <%= @confirm_delete.task_count %> tasks will move to inbox.
            <% end %>
            <%= if @confirm_delete.project_count > 0 do %>
              <%= @confirm_delete.project_count %> projects will lose their area.
            <% end %>
          </p>
        </div>
        <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <.button phx-click={JS.push("cancel_confirm", target: @myself)} variant="secondary">Cancel</.button>
          <.button phx-click={JS.push("delete_area", target: @myself)} class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </.button>
        </div>
      </.modal>
    </div>
    """
  end
end
