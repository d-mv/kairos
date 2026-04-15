defmodule KairosWeb.PageController do
  use KairosWeb, :controller

  def home(conn, _params) do
    render(conn, :home)
  end
end
