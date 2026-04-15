defmodule Kairos.Projects do
  import Ecto.Query
  alias Kairos.Repo
  alias Kairos.Projects.Project
  alias Kairos.Tasks.Task

  def list_projects(user_id) do
    Project
    |> where([p], p.user_id == ^user_id)
    |> order_by([p], [p.position, p.name])
    |> Repo.all()
  end

  def list_for_area(area_id, user_id) do
    Project
    |> where([p], p.area_id == ^area_id and p.user_id == ^user_id)
    |> order_by([p], [p.position, p.name])
    |> Repo.all()
  end

  def get_project!(id, user_id) do
    Project
    |> where([p], p.id == ^id and p.user_id == ^user_id)
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
        |> Repo.all()
        |> Enum.each(fn t ->
          t
          |> Task.changeset(%{project_id: nil})
          |> Repo.update!()
        end)

        Repo.delete!(project)
        task
      end)
    end
  end
end
