defmodule KairosWeb.SidebarProjectComponent do
  use KairosWeb, :live_component

  alias Kairos.Projects

  @impl true
  def mount(socket) do
    {:ok,
     assign(socket,
       menu_open: false,
       renaming: false,
       confirm_delete: nil,
       confirm_demote: nil,
       demote_error: nil
     )}
  end

  @impl true
  def update(assigns, socket) do
    {:ok, assign(socket, assigns)}
  end

  @impl true
  def handle_event("toggle_menu", _params, socket) do
    {:noreply, assign(socket, menu_open: !socket.assigns.menu_open, confirm_delete: nil, confirm_demote: nil)}
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
    project = socket.assigns.project
    case Projects.update_project(project, %{name: String.trim(name)}) do
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
    project = socket.assigns.project
    task_count = Projects.count_tasks(project.id)

    {:noreply,
     assign(socket,
       confirm_delete: %{task_count: task_count},
       menu_open: false
     )}
  end

  def handle_event("delete_project", _params, socket) do
    project = socket.assigns.project
    {:ok, _} = Projects.delete_project(project)
    send_update(KairosWeb.SidebarComponent, id: "sidebar-component", fetch_data: true)
    {:noreply, assign(socket, confirm_delete: nil)}
  end

  def handle_event("confirm_demote", _params, socket) do
    {:noreply, assign(socket, confirm_demote: true, menu_open: false, demote_error: nil)}
  end

  def handle_event("demote_project", _params, socket) do
    project = socket.assigns.project

    case Projects.demote_to_task(project) do
      {:ok, _task} ->
        send_update(KairosWeb.SidebarComponent, id: "sidebar-component", fetch_data: true)
        {:noreply, assign(socket, confirm_demote: nil)}

      {:error, :has_subtasks} ->
        {:noreply, assign(socket, demote_error: "Cannot demote: project tasks have subtasks.", confirm_demote: nil)}
    end
  end

  def handle_event("cancel_confirm", _params, socket) do
    {:noreply,
     assign(socket,
       confirm_delete: nil,
       confirm_demote: nil,
       demote_error: nil
     )}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div id={"sidebar-project-wrapper-#{@project.id}"} class="relative">
      <%= if @renaming do %>
        <form
          id={"sidebar-rename-project-form-#{@project.id}"}
          phx-submit="save_rename"
          phx-target={@myself}
          class={["flex items-center gap-1 py-1", if(@indent, do: "pl-7 pr-2", else: "px-2")]}
        >
          <.icon name="hero-folder" class={["text-muted-foreground shrink-0", if(@indent, do: "w-3.5 h-3.5", else: "w-4 h-4")]} />
          <input
            type="text"
            name="name"
            value={@project.name}
            class="flex-1 text-sm border rounded px-1 py-0.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            phx-mounted={JS.focus()}
            phx-keydown="cancel_rename"
            phx-key="Escape"
            phx-target={@myself}
          />
        </form>
      <% else %>
        <div class="flex items-center rounded hover:bg-muted group/proj">
          <.link
            id={"sidebar-project-#{@project.id}"}
            navigate={~p"/projects/#{@project.id}"}
            class={["flex items-center gap-2 py-1.5 text-sm flex-1 min-w-0", if(@indent, do: "pl-7 pr-2 text-muted-foreground", else: "px-2")]}
          >
            <.icon name="hero-folder" class={["shrink-0", if(@indent, do: "w-3.5 h-3.5", else: "w-4 h-4 text-muted-foreground")]} />
            <span class="flex-1 truncate">{@project.name}</span>
          </.link>
          <div class="relative">
            <button
              id={"sidebar-project-menu-btn-#{@project.id}"}
              phx-click="toggle_menu"
              phx-target={@myself}
              class="opacity-0 group-hover/proj:opacity-100 p-0.5 rounded hover:bg-muted text-muted-foreground mr-2 shrink-0"
              title="Project options"
            >
              <.icon name="hero-ellipsis-horizontal" class="w-6 h-6" />
            </button>
            <%= if @menu_open do %>
              <div
                id={"sidebar-project-menu-#{@project.id}"}
                class="absolute right-0 top-full mt-1 z-50 w-40 bg-background border border-border rounded-xl shadow-xl py-1"
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
                  phx-click="confirm_demote"
                  phx-target={@myself}
                  class="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2"
                >
                  <.icon name="hero-arrow-down-circle" class="w-3.5 h-3.5 text-muted-foreground" /> Demote to task
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
      <% end %>

      <%!-- Confirm Delete Project --%>
      <.modal
        :if={@confirm_delete}
        id={"confirm-delete-project-modal-#{@project.id}"}
        show={true}
        on_cancel={JS.push("cancel_confirm", target: @myself)}
      >
        <div class="text-left">
          <h3 class="text-lg font-semibold leading-6 text-foreground">Delete project</h3>
          <p class="mt-3 text-sm text-muted-foreground">
            Delete project "<%= @project.name %>"?
            <%= if @confirm_delete.task_count > 0 do %>
              <%= @confirm_delete.task_count %> tasks will move to inbox.
            <% end %>
          </p>
        </div>
        <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <.button phx-click={JS.push("cancel_confirm", target: @myself)} variant="secondary">Cancel</.button>
          <.button phx-click={JS.push("delete_project", target: @myself)} class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </.button>
        </div>
      </.modal>

      <%!-- Confirm Demote Project --%>
      <.modal
        :if={@confirm_demote}
        id={"confirm-demote-project-modal-#{@project.id}"}
        show={true}
        on_cancel={JS.push("cancel_confirm", target: @myself)}
      >
        <div class="text-left">
          <h3 class="text-lg font-semibold leading-6 text-foreground">Convert to task</h3>
          <p class="mt-3 text-sm text-muted-foreground">
            Convert project "<%= @project.name %>" to a task? All tasks within will move to inbox.
          </p>
        </div>
        <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <.button phx-click={JS.push("cancel_confirm", target: @myself)} variant="secondary">Cancel</.button>
          <.button phx-click={JS.push("demote_project", target: @myself)} variant="primary">
            Convert
          </.button>
        </div>
      </.modal>

      <%!-- Error Modal (e.g. Demote Error) --%>
      <.modal
        :if={@demote_error}
        id={"error-modal-#{@project.id}"}
        show={true}
        on_cancel={JS.push("cancel_confirm", target: @myself)}
      >
        <div class="text-left">
          <h3 class="text-lg font-semibold leading-6 text-destructive">Error</h3>
          <p class="mt-3 text-sm text-muted-foreground"><%= @demote_error %></p>
        </div>
        <div class="mt-6 flex justify-end">
          <.button phx-click={JS.push("cancel_confirm", target: @myself)} variant="primary">OK</.button>
        </div>
      </.modal>
    </div>
    """
  end
end
