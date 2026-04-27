defmodule Kairos.Projects do
  import Ecto.Query
  alias Kairos.Repo
  alias Kairos.Projects.Project
  alias Kairos.Tasks.Task

  def list_projects(user_id) do
    Project
    |> Repo.scope(user_id)
    |> order_by([p], [p.position, p.name])
    |> Repo.all()
  end

  def list_for_area(area_id, user_id) do
    Project
    |> Repo.scope(user_id)
    |> where([p], p.area_id == ^area_id)
    |> order_by([p], [p.position, p.name])
    |> Repo.all()
  end

  def search(user_id, query) do
    term = "%#{query}%"

    Project
    |> Repo.scope(user_id)
    |> where([p], ilike(p.name, ^term))
    |> order_by([p], [p.position, p.name])
    |> Repo.all()
  end

  def search_for_linking(user_id, query) do
    term = "%#{query}%"

    Project
    |> Repo.scope(user_id)
    |> where([p], ilike(p.name, ^term))
    |> limit(10)
    |> Repo.all()
  end

  def get_project(id, user_id) do
    Project
    |> Repo.scope(user_id)
    |> where([p], p.id == ^id)
    |> Repo.one()
  end

  def get_project!(id, user_id) do
    Project
    |> Repo.scope(user_id)
    |> where([p], p.id == ^id)
    |> Repo.one!()
  end

  def create_project(attrs) do
    %Project{}
    |> Project.changeset(attrs)
    |> Repo.insert()
  end

  def update_project(%Project{} = project, attrs) do
    project
    |> Project.changeset(attrs)
    |> Repo.update()
  end

  def delete_project(%Project{} = project) do
    Repo.delete(project)
  end

  def toggle_show_completed(%Project{} = project) do
    update_project(project, %{show_completed: !project.show_completed})
  end

  def complete_project(%Project{} = project), do: update_project(project, %{status: "completed"})

  def reopen_project(%Project{} = project), do: update_project(project, %{status: "active"})

  def count_tasks(project_id) do
    Task |> where([t], t.project_id == ^project_id) |> Repo.aggregate(:count)
  end

  def demote_to_task(%Project{} = project) do
    # A project task has subtasks if any task's parent_id points to a project task
    project_task_ids =
      Task
      |> where([t], t.project_id == ^project.id)
      |> select([t], t.id)
      |> Repo.all()

    has_subtasks =
      Task
      |> where([t], t.parent_id in ^project_task_ids)
      |> Repo.exists?()

    if has_subtasks do
      {:error, :has_subtasks}
    else
      Repo.transaction(fn ->
        {:ok, task} = Kairos.Tasks.create_task(%{
          title: project.name,
          user_id: project.user_id,
          area_id: project.area_id
        })

        # Move project tasks to inbox (no container)
        Task
        |> where([t], t.project_id == ^project.id)
        |> Repo.update_all(set: [project_id: nil])

        Repo.delete!(project)
        task
      end)
    end
  end
end
