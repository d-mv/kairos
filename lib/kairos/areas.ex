defmodule Kairos.Areas do
  import Ecto.Query
  alias Kairos.Repo
  alias Kairos.Areas.Area
  alias Kairos.Tasks.Task
  alias Kairos.Projects.Project

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

  def count_tasks(area_id) do
    Task |> where([t], t.area_id == ^area_id) |> Repo.aggregate(:count)
  end

  def count_projects(area_id) do
    Project |> where([p], p.area_id == ^area_id) |> Repo.aggregate(:count)
  end
end
