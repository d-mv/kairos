defmodule Kairos.Areas do
  import Ecto.Query
  alias Kairos.Repo
  alias Kairos.Areas.Area

  def list_areas(user_id) do
    Area
    |> where([a], a.user_id == ^user_id)
    |> order_by([a], a.name)
    |> Repo.all()
  end

  def get_area!(id, user_id) do
    Area
    |> where([a], a.id == ^id and a.user_id == ^user_id)
    |> Repo.one!()
  end

  def create_area(attrs) do
    %Area{}
    |> Area.changeset(attrs)
    |> Repo.insert()
  end

  def update_area(%Area{} = area, attrs) do
    area
    |> Area.changeset(attrs)
    |> Repo.update()
  end

  def delete_area(%Area{} = area) do
    Repo.delete(area)
  end
end
