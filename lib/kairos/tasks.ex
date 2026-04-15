defmodule Kairos.Tasks do
  import Ecto.Query
  alias Kairos.Repo
  alias Kairos.Tasks.Task
  alias Kairos.Projects

  def list_tasks(user_id) do
    Task
    |> where([t], t.user_id == ^user_id)
    |> order_by([t], [t.position, t.inserted_at])
    |> Repo.all()
  end

  def list_inbox(user_id) do
    Task
    |> where([t], t.user_id == ^user_id)
    |> where([t], is_nil(t.project_id) and is_nil(t.area_id) and is_nil(t.parent_id))
    |> order_by([t], [t.position, t.inserted_at])
    |> Repo.all()
  end

  def list_today(user_id) do
    today = Date.utc_today()

    Task
    |> where([t], t.user_id == ^user_id)
    |> where([t], t.due_date == ^today and t.status == "pending")
    |> order_by([t], [t.position, t.inserted_at])
    |> Repo.all()
  end

  def list_upcoming(user_id) do
    today = Date.utc_today()

    Task
    |> where([t], t.user_id == ^user_id)
    |> where([t], not is_nil(t.due_date) and t.due_date > ^today and t.status == "pending")
    |> order_by([t], [t.due_date, t.position])
    |> Repo.all()
  end

  def list_completed(user_id) do
    Task
    |> where([t], t.user_id == ^user_id)
    |> where([t], t.status == "completed")
    |> order_by([t], desc: t.updated_at)
    |> Repo.all()
  end

  def list_for_project(project_id, user_id) do
    Task
    |> where([t], t.project_id == ^project_id and t.user_id == ^user_id)
    |> where([t], is_nil(t.parent_id))
    |> order_by([t], [t.position, t.inserted_at])
    |> preload(:subtasks)
    |> Repo.all()
  end

  def list_for_area(area_id, user_id) do
    Task
    |> where([t], t.area_id == ^area_id and t.user_id == ^user_id)
    |> where([t], is_nil(t.parent_id))
    |> order_by([t], [t.position, t.inserted_at])
    |> preload(:subtasks)
    |> Repo.all()
  end

  def search(user_id, query) do
    term = "%#{query}%"

    Task
    |> where([t], t.user_id == ^user_id)
    |> where([t], ilike(t.title, ^term) or ilike(t.notes, ^term))
    |> order_by([t], [t.position, t.inserted_at])
    |> Repo.all()
  end

  def get_task!(id, user_id) do
    Task
    |> where([t], t.id == ^id and t.user_id == ^user_id)
    |> preload(:subtasks)
    |> Repo.one!()
  end

  def create_task(attrs) do
    parent_id = Map.get(attrs, :parent_id) || Map.get(attrs, "parent_id")

    with :ok <- check_max_depth(parent_id) do
      %Task{}
      |> Task.changeset(attrs)
      |> Repo.insert()
    end
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
      |> Repo.all()
      |> Enum.each(fn sub ->
        sub
        |> Task.changeset(%{parent_id: nil, project_id: project.id})
        |> Repo.update!()
      end)

      Repo.delete!(task)
      project
    end)
  end

  defp check_max_depth(nil), do: :ok

  defp check_max_depth(parent_id) do
    parent = Repo.get(Task, parent_id)

    if parent && parent.parent_id != nil do
      {:error, :max_depth}
    else
      :ok
    end
  end
end
