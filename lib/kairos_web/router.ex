defmodule KairosWeb.Router do
  use KairosWeb, :router

  import KairosWeb.UserAuth

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {KairosWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug :fetch_current_scope_for_user
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :mcp do
    plug Kairos.MCP.AuthPlug
  end

  # Redirect root to inbox (authenticated) or login
  scope "/", KairosWeb do
    pipe_through :browser
    get "/", PageController, :home
  end

  # All app routes require authentication
  scope "/", KairosWeb do
    pipe_through [:browser, :require_authenticated_user]

    live_session :require_authenticated_user,
      on_mount: [{KairosWeb.UserAuth, :require_authenticated}, {KairosWeb.Nav, :load_nav}] do
      live "/inbox", InboxLive, :index
      live "/today", TodayLive, :index
      live "/upcoming", UpcomingLive, :index
      live "/completed", CompletedLive, :index
      live "/search", SearchLive, :index
      live "/browse", BrowseLive, :index
      live "/gantt", GanttLive, :index
      live "/areas/:id", AreaLive, :index
      live "/projects/:id", ProjectLive, :index

      live "/users/settings", UserLive.Settings, :edit
      live "/users/settings/confirm-email/:token", UserLive.Settings, :confirm_email
    end

    post "/users/update-password", UserSessionController, :update_password
  end

  # Auth routes (no auth required)
  scope "/", KairosWeb do
    pipe_through [:browser]

    live_session :current_user,
      on_mount: [{KairosWeb.UserAuth, :mount_current_scope}] do
      live "/users/register", UserLive.Registration, :new
      live "/users/log-in", UserLive.Login, :new
      live "/users/log-in/:token", UserLive.Confirmation, :new
    end

    post "/users/log-in", UserSessionController, :create
    delete "/users/log-out", UserSessionController, :delete
  end

  # MCP server endpoint — requires Bearer token auth
  scope "/mcp" do
    pipe_through :mcp
    forward "/", Hermes.Server.Transport.StreamableHTTP.Plug, server: Kairos.MCP.Server
  end

  if Application.compile_env(:kairos, :dev_routes) do
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through :browser
      live_dashboard "/dashboard", metrics: KairosWeb.Telemetry
      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end
end
