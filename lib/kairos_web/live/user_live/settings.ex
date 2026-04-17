defmodule KairosWeb.UserLive.Settings do
  use KairosWeb, :live_view

  alias Kairos.Accounts

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app flash={@flash} current_scope={@current_scope} nav_areas={assigns[:nav_areas] || []} nav_projects={assigns[:nav_projects] || []}>
      <div id="settings-container" class="w-full py-8 px-4 max-w-2xl mx-auto">
        <h1 class="text-2xl font-semibold mb-6">Settings</h1>

        <div class="flex border-b border-border mb-8">
          <button
            phx-click="set_tab"
            phx-value-tab="profile"
            class={[
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              @active_tab == "profile" && "border-primary text-primary",
              @active_tab != "profile" && "border-transparent text-muted-foreground hover:text-foreground"
            ]}
          >
            Profile
          </button>
          <button
            phx-click="set_tab"
            phx-value-tab="integrations"
            class={[
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              @active_tab == "integrations" && "border-primary text-primary",
              @active_tab != "integrations" && "border-transparent text-muted-foreground hover:text-foreground"
            ]}
          >
            Integrations
          </button>
        </div>

        <%= if @active_tab == "profile" do %>
          <div id="profile-settings" class="max-w-md">
            <h2 class="text-lg font-medium mb-4">Account Settings</h2>
            <p class="text-sm text-muted-foreground mb-6">Manage your account email address and password settings</p>

            <.form for={@email_form} id="email_form" phx-submit="update_email" phx-change="validate_email" class="space-y-4">
              <.input
                field={@email_form[:email]}
                type="email"
                label="Email"
                autocomplete="username"
                spellcheck="false"
                required
              />
              <.button variant="primary" phx-disable-with="Changing...">Change Email</.button>
            </.form>

            <div class="my-10 border-t border-border" />

            <.form
              for={@password_form}
              id="password_form"
              action={~p"/users/update-password"}
              method="post"
              phx-change="validate_password"
              phx-submit="update_password"
              phx-trigger-action={@trigger_submit}
              class="space-y-4"
            >
              <input
                name={@password_form[:email].name}
                type="hidden"
                id="hidden_user_email"
                spellcheck="false"
                value={@current_email}
              />
              <.input
                field={@password_form[:password]}
                type="password"
                label="New password"
                autocomplete="new-password"
                spellcheck="false"
                required
              />
              <.input
                field={@password_form[:password_confirmation]}
                type="password"
                label="Confirm new password"
                autocomplete="new-password"
                spellcheck="false"
              />
              <.button variant="primary" phx-disable-with="Saving...">
                Save Password
              </.button>
            </.form>
          </div>
        <% end %>

        <%= if @active_tab == "integrations" do %>
          <div id="integrations-settings" class="space-y-8">
            <div>
              <h2 class="text-lg font-medium mb-2">MCP Tokens</h2>
              <p class="text-sm text-muted-foreground mb-6">
                Create personal access tokens to use Kairos via Model Context Protocol (MCP) in AI tools like Claude.
              </p>

              <div id="mcp-tokens-list" class="space-y-4">
                <%= for token <- @mcp_tokens do %>
                  <div id={"token-#{token.id}"} class="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                    <div>
                      <div class="text-sm font-medium"><%= token.name %></div>
                      <div class="text-xs text-muted-foreground">Created on <%= Calendar.strftime(token.inserted_at, "%b %d, %Y") %></div>
                    </div>
                    <button
                      phx-click="delete_token"
                      phx-value-id={token.id}
                      data-confirm="Are you sure you want to delete this token? Any AI agent using it will lose access."
                      class="p-2 text-muted-foreground hover:text-destructive"
                    >
                      <.icon name="hero-trash" class="w-4 h-4" />
                    </button>
                  </div>
                <% end %>

                <%= if Enum.empty?(@mcp_tokens) do %>
                  <div class="text-sm text-muted-foreground text-center py-8 border border-dashed border-border rounded-lg">
                    No tokens yet. Create one to get started.
                  </div>
                <% end %>
              </div>

              <div class="mt-6 pt-6 border-t border-border">
                <h3 class="text-sm font-medium mb-4">Create New Token</h3>
                <form phx-submit="create_token" class="flex gap-2">
                  <input
                    type="text"
                    name="name"
                    placeholder="Token name (e.g. Claude Desktop)"
                    class="flex-1 border border-border rounded px-3 py-2 text-sm bg-background"
                    required
                  />
                  <.button type="submit" variant="primary">Create</.button>
                </form>
              </div>
            </div>
          </div>
        <% end %>
      </div>

      <%!-- Raw Token Modal --%>
      <%= if @new_raw_token do %>
        <div id="token-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div class="bg-card w-full max-w-md p-6 border border-border rounded-lg shadow-lg">
            <h3 class="text-lg font-semibold mb-2">Token Created Successfully</h3>
            <p class="text-sm text-muted-foreground mb-4">
              Copy this token now. For security, it will <strong>never be shown again</strong>.
            </p>

            <div class="flex items-center gap-2 p-3 bg-muted rounded border border-border mb-6">
              <code class="text-xs font-mono break-all flex-1"><%= @new_raw_token %></code>
              <button
                class="p-2 hover:bg-background rounded"
                data-clipboard-text={@new_raw_token}
                onclick={"navigator.clipboard.writeText('#{@new_raw_token}')"}
                id="copy-token-btn"
              >
                <.icon name="hero-clipboard" class="w-4 h-4" />
              </button>
            </div>

            <div class="flex justify-end">
              <.button phx-click="close_token_modal" variant="primary">I've saved it</.button>
            </div>
          </div>
        </div>
      <% end %>
    </Layouts.app>
    """
  end

  @impl true
  def mount(%{"token" => token}, _session, socket) do
    socket =
      case Accounts.update_user_email(socket.assigns.current_scope.user, token) do
        {:ok, _user} ->
          put_flash(socket, :info, "Email changed successfully.")

        {:error, _} ->
          put_flash(socket, :error, "Email change link is invalid or it has expired.")
      end

    {:ok, push_navigate(socket, to: ~p"/users/settings")}
  end

  def mount(_params, _session, socket) do
    user = socket.assigns.current_scope.user
    email_changeset = Accounts.change_user_email(user, %{}, validate_unique: false)
    password_changeset = Accounts.change_user_password(user, %{}, hash_password: false)

    mcp_tokens = Accounts.list_mcp_tokens(user.id)

    socket =
      socket
      |> assign(:active_tab, "profile")
      |> assign(:current_email, user.email)
      |> assign(:email_form, to_form(email_changeset))
      |> assign(:password_form, to_form(password_changeset))
      |> assign(:trigger_submit, false)
      |> assign(:mcp_tokens, mcp_tokens)
      |> assign(:new_raw_token, nil)

    {:ok, socket}
  end

  @impl true
  def handle_event("set_tab", %{"tab" => tab}, socket) do
    {:noreply, assign(socket, active_tab: tab)}
  end

  def handle_event("create_token", %{"name" => name}, socket) do
    user_id = socket.assigns.current_scope.user.id

    case Accounts.create_mcp_token(user_id, name) do
      {:ok, {_token, raw_token}} ->
        mcp_tokens = Accounts.list_mcp_tokens(user_id)

        {:noreply,
         socket
         |> assign(:mcp_tokens, mcp_tokens)
         |> assign(:new_raw_token, raw_token)}

      {:error, _changeset} ->
        {:noreply, put_flash(socket, :error, "Failed to create token.")}
    end
  end

  def handle_event("delete_token", %{"id" => id}, socket) do
    user_id = socket.assigns.current_scope.user.id
    :ok = Accounts.delete_mcp_token(user_id, id)
    mcp_tokens = Accounts.list_mcp_tokens(user_id)
    {:noreply, assign(socket, mcp_tokens: mcp_tokens)}
  end

  def handle_event("close_token_modal", _, socket) do
    {:noreply, assign(socket, new_raw_token: nil)}
  end

  def handle_event("validate_email", params, socket) do
    %{"user" => user_params} = params

    email_form =
      socket.assigns.current_scope.user
      |> Accounts.change_user_email(user_params, validate_unique: false)
      |> Map.put(:action, :validate)
      |> to_form()

    {:noreply, assign(socket, email_form: email_form)}
  end

  def handle_event("update_email", params, socket) do
    %{"user" => user_params} = params
    user = socket.assigns.current_scope.user

    case Accounts.change_user_email(user, user_params) do
      %{valid?: true} = changeset ->
        Accounts.deliver_user_update_email_instructions(
          Ecto.Changeset.apply_action!(changeset, :insert),
          user.email,
          &url(~p"/users/settings/confirm-email/#{&1}")
        )

        info = "A link to confirm your email change has been sent to the new address."
        {:noreply, socket |> put_flash(:info, info)}

      changeset ->
        {:noreply, assign(socket, :email_form, to_form(changeset, action: :insert))}
    end
  end

  def handle_event("validate_password", params, socket) do
    %{"user" => user_params} = params

    password_form =
      socket.assigns.current_scope.user
      |> Accounts.change_user_password(user_params, hash_password: false)
      |> Map.put(:action, :validate)
      |> to_form()

    {:noreply, assign(socket, password_form: password_form)}
  end

  def handle_event("update_password", params, socket) do
    %{"user" => user_params} = params
    user = socket.assigns.current_scope.user

    case Accounts.change_user_password(user, user_params) do
      %{valid?: true} = changeset ->
        {:noreply, assign(socket, trigger_submit: true, password_form: to_form(changeset))}

      changeset ->
        {:noreply, assign(socket, password_form: to_form(changeset, action: :insert))}
    end
  end
end
