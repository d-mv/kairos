defmodule Kairos.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      TwMerge.Cache,
      KairosWeb.Telemetry,
      Kairos.Repo,
      {DNSCluster, query: Application.get_env(:kairos, :dns_cluster_query) || :ignore},
      {Finch, name: Kairos.Finch},
      {Phoenix.PubSub, name: Kairos.PubSub},
      Hermes.Server.Registry,
      {Kairos.MCP.Server, transport: :streamable_http},
      KairosWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Kairos.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    KairosWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
