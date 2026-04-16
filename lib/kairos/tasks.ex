defmodule Kairos.Tasks do
  import Ecto.Query
  alias Kairos.Repo
  alias Kairos.Tasks.Task
  alias Kairos.UrlParser

  def list_tasks(user_id) do
    Task
    |> Repo.scope(user_id)
    |> order_by([t], [t.position, t.inserted_at])
    |> Repo.all()
  end

  def list_inbox(user_id) do
    Task
    |> Repo.scope(user_id)
    |> where([t], is_nil(t.project_id) and is_nil(t.area_id) and is_nil(t.parent_id))
    |> order_by([t], [t.position, t.inserted_at])
    |> Repo.all()
  end

  def list_today(user_id) do
    today = Date.utc_today()

    Task
    |> Repo.scope(user_id)
    |> where([t], t.due_date == ^today and t.status == "pending")
    |> order_by([t], [t.position, t.inserted_at])
    |> Repo.all()
  end

  def list_upcoming(user_id) do
    today = Date.utc_today()

    Task
    |> Repo.scope(user_id)
    |> where([t], not is_nil(t.due_date) and t.due_date > ^today and t.status == "pending")
    |> order_by([t], [t.due_date, t.position])
    |> Repo.all()
  end

  def list_completed(user_id) do
    Task
    |> Repo.scope(user_id)
    |> where([t], t.status == "completed")
    |> order_by([t], desc: t.updated_at)
    |> Repo.all()
  end

  def list_for_project(project_id, user_id) do
    Task
    |> Repo.scope(user_id)
    |> where([t], t.project_id == ^project_id)
    |> where([t], is_nil(t.parent_id))
    |> order_by([t], [t.position, t.inserted_at])
    |> preload(:subtasks)
    |> Repo.all()
  end

  def list_for_area(area_id, user_id) do
    Task
    |> Repo.scope(user_id)
    |> where([t], t.area_id == ^area_id)
    |> where([t], is_nil(t.parent_id))
    |> order_by([t], [t.position, t.inserted_at])
    |> preload(:subtasks)
    |> Repo.all()
  end

  def search(user_id, query) do
    term = "%#{query}%"

    Task
    |> Repo.scope(user_id)
    |> where([t], ilike(t.title, ^term) or ilike(t.notes, ^term))
    |> order_by([t], [t.position, t.inserted_at])
    |> Repo.all()
  end

  def search_for_linking(user_id, query, exclude_id) do
    term = "%#{query}%"

    Task
    |> Repo.scope(user_id)
    |> where([t], ilike(t.title, ^term))
    |> where([t], t.id != ^exclude_id)
    |> limit(10)
    |> Repo.all()
  end

  def get_task(id, user_id) do
    Task
    |> Repo.scope(user_id)
    |> where([t], t.id == ^id)
    |> Repo.one()
  end

  def get_task!(id, user_id) do
    Task
    |> Repo.scope(user_id)
    |> where([t], t.id == ^id)
    |> preload(:subtasks)
    |> Repo.one!()
  end

  def create_task(attrs) do
    parent_id = Map.get(attrs, :parent_id) || Map.get(attrs, "parent_id")
    user_id = Map.get(attrs, :user_id) || Map.get(attrs, "user_id")
    title = Map.get(attrs, :title) || Map.get(attrs, "title")

    attrs =
      case URI.parse(title) do
        %URI{scheme: s, host: h} when s in ["http", "https"] and is_binary(h) ->
          case UrlParser.fetch_metadata(title) do
            {:ok, %{title: fetched_title}} when is_binary(fetched_title) ->
              attrs
              |> Map.put(:title, fetched_title)
              |> Map.put(:url, title)

            _ ->
              attrs
          end

        _ ->
          attrs
      end

    with :ok <- check_max_depth(parent_id, user_id) do
      %Task{}
      |> Task.changeset(attrs)
      |> Repo.insert()
    end
  end

  def change_task(%Task{} = task, attrs \\ %{}) do
    Task.changeset(task, attrs)
  end

  def update_task(%Task{} = task, attrs) do
    task
    |> Task.changeset(attrs)
    |> Repo.update()
  end

  def complete_task(%Task{} = task) do
    task
    |> Task.changeset(%{status: "completed"})
    |> Repo.update()
  end

  def reopen_task(%Task{} = task) do
    task
    |> Task.changeset(%{status: "pending"})
    |> Repo.update()
  end

  def delete_task(%Task{} = task) do
    Repo.delete(task)
  end

  def promote_to_project(%Task{} = task) do
    Repo.transaction(fn ->
      {:ok, project} = Projects.create_project(%{
        name: task.title,
        user_id: task.user_id,
        area_id: task.area_id
      })

      # Move subtasks to project as top-level tasks
      Task
      |> where([t], t.parent_id == ^task.id)
      |> Repo.update_all(set: [parent_id: nil, project_id: project.id])

      Repo.delete!(task)
      project
    end)
  end

  defp check_max_depth(nil, _user_id), do: :ok

  defp check_max_depth(parent_id, user_id) do
    parent = Task |> Repo.scope(user_id) |> Repo.get(parent_id)

    if parent && parent.parent_id != nil do
      {:error, :max_depth}
    else
      :ok
    end
  end
end
