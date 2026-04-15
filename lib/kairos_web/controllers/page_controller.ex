defmodule KairosWeb.PageController do
  use KairosWeb, :controller

  def home(conn, _params) do
    redirect(conn, to: ~p"/inbox")
  end
end
