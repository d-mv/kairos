defmodule Kairos.Links do
  import Ecto.Query
  alias Kairos.Repo
  alias Kairos.Links.Link
  alias Kairos.Tasks
  alias Kairos.Projects

  def list_links_for(entity_id, entity_type, user_id) do
    Link
    |> where([l], l.user_id == ^user_id)
    |> where([l], (l.from_id == ^entity_id and l.from_type == ^entity_type) or
                  (l.to_id == ^entity_id and l.to_type == ^entity_type))
    |> Repo.all()
  end

  def create_link(attrs, user_id) do
    from_id = Map.get(attrs, :from_id) || Map.get(attrs, "from_id")
    to_id = Map.get(attrs, :to_id) || Map.get(attrs, "to_id")
    from_type = Map.get(attrs, :from_type) || Map.get(attrs, "from_type")
    to_type = Map.get(attrs, :to_type) || Map.get(attrs, "to_type")

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
