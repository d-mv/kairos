defmodule Kairos.Links do
  import Ecto.Query
  alias Kairos.Repo
  alias Kairos.Links.Link
  alias Kairos.Tasks
  alias Kairos.Tasks.Task
  alias Kairos.Projects
  alias Kairos.Projects.Project

  def list_links_for(entity_id, entity_type, user_id) do
    Link
    |> where([l], l.user_id == ^user_id)
    |> where([l], (l.from_id == ^entity_id and l.from_type == ^entity_type) or
                  (l.to_id == ^entity_id and l.to_type == ^entity_type))
    |> Repo.all()
  end

  def list_detailed_links_for(entity_id, entity_type, user_id) do
    links = list_links_for(entity_id, entity_type, user_id)

    # Separate target IDs by type to fetch details efficiently
    task_ids = Enum.flat_map(links, fn l ->
      if l.from_id == entity_id and l.from_type == entity_type do
        if l.to_type == "task", do: [l.to_id], else: []
      else
        if l.from_type == "task", do: [l.from_id], else: []
      end
    end)

    project_ids = Enum.flat_map(links, fn l ->
      if l.from_id == entity_id and l.from_type == entity_type do
        if l.to_type == "project", do: [l.to_id], else: []
      else
        if l.from_type == "project", do: [l.from_id], else: []
      end
    end)

    tasks_map =
      Task
      |> where([t], t.id in ^task_ids)
      |> Repo.all()
      |> Map.new(&{&1.id, &1.title})

    projects_map =
      Project
      |> where([p], p.id in ^project_ids)
      |> Repo.all()
      |> Map.new(&{&1.id, &1.name})

    Enum.map(links, fn l ->
      {target_id, target_type} =
        if l.from_id == entity_id and l.from_type == entity_type do
          {l.to_id, l.to_type}
        else
          {l.from_id, l.from_type}
        end

      title =
        case target_type do
          "task" -> Map.get(tasks_map, target_id, "Unknown Task")
          "project" -> Map.get(projects_map, target_id, "Unknown Project")
          _ -> "Unknown"
        end

      Map.merge(l, %{target_title: title, target_id: target_id, target_type: target_type})
    end)
  end

  def list_blocking_links_for_user(user_id) do
    Link
    |> where([l], l.user_id == ^user_id and l.link_type == "blocks")
    |> Repo.all()
  end

  def get_link(id, user_id) do
    Link
    |> where([l], l.id == ^id and l.user_id == ^user_id)
    |> Repo.one()
  end

  def create_link(attrs) do
    from_id = Map.get(attrs, :from_id) || Map.get(attrs, "from_id")
    to_id = Map.get(attrs, :to_id) || Map.get(attrs, "to_id")
    from_type = Map.get(attrs, :from_type) || Map.get(attrs, "from_type")
    to_type = Map.get(attrs, :to_type) || Map.get(attrs, "to_type")
    user_id = Map.get(attrs, :user_id) || Map.get(attrs, "user_id")

    if from_id == to_id do
      {:error, :self_link}
    else
      with :ok <- verify_ownership(from_id, from_type, user_id),
           :ok <- verify_ownership(to_id, to_type, user_id) do
        Repo.transaction(fn ->
          link = insert_link!(attrs)
          insert_inverse!(attrs)
          link
        end)
      end
    end
  end

  def delete_link(%Link{} = link) do
    Repo.transaction(fn ->
      # Delete the link and its inverse
      Repo.delete!(link)

      inverse_type = Link.inverse_type(link.link_type)

      Link
      |> where([l], l.from_id == ^link.to_id and l.to_id == ^link.from_id and l.link_type == ^inverse_type)
      |> Repo.delete_all()
    end)
  end

  defp verify_ownership(id, "task", user_id) do
    if Tasks.get_task(id, user_id), do: :ok, else: {:error, :unauthorized}
  end

  defp verify_ownership(id, "project", user_id) do
    if Projects.get_project(id, user_id), do: :ok, else: {:error, :unauthorized}
  end

  defp verify_ownership(_id, _type, _user_id), do: :ok

  defp insert_link!(attrs) do
    %Link{}
    |> Link.changeset(attrs)
    |> Repo.insert!()
  end

  defp insert_inverse!(attrs) do
    inverse_type = Link.inverse_type(
      Map.get(attrs, :link_type) || Map.get(attrs, "link_type")
    )

    inverse_attrs = %{
      from_id: Map.get(attrs, :to_id) || Map.get(attrs, "to_id"),
      from_type: Map.get(attrs, :to_type) || Map.get(attrs, "to_type"),
      to_id: Map.get(attrs, :from_id) || Map.get(attrs, "from_id"),
      to_type: Map.get(attrs, :from_type) || Map.get(attrs, "from_type"),
      link_type: inverse_type,
      user_id: Map.get(attrs, :user_id) || Map.get(attrs, "user_id")
    }

    %Link{}
    |> Link.changeset(inverse_attrs)
    |> Repo.insert!(on_conflict: :nothing)
  end
end
