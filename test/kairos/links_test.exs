defmodule Kairos.LinksTest do
  use Kairos.DataCase, async: true

  alias Kairos.Links
  alias Kairos.Tasks
  alias Kairos.Projects

  import Kairos.AccountsFixtures

  setup do
    user = user_fixture()
    other = user_fixture()
    {:ok, t1} = Tasks.create_task(%{title: "A", user_id: user.id})
    {:ok, t2} = Tasks.create_task(%{title: "B", user_id: user.id})
    {:ok, t_other} = Tasks.create_task(%{title: "Other", user_id: other.id})
    %{user: user, other: other, t1: t1, t2: t2, t_other: t_other}
  end

  describe "create_link/1" do
    test "creates blocks link and auto-creates blocked_by inverse", %{user: user, t1: t1, t2: t2} do
      assert {:ok, link} = Links.create_link(%{
        from_id: t1.id, from_type: "task",
        to_id: t2.id, to_type: "task",
        link_type: "blocks",
        user_id: user.id
      })
      assert link.link_type == "blocks"

      links = Links.list_links_for(t2.id, "task", user.id)
      assert Enum.any?(links, &(&1.link_type == "blocked_by" && &1.from_id == t2.id))
    end

    test "creates related_to and auto-creates symmetric inverse", %{user: user, t1: t1, t2: t2} do
      assert {:ok, _} = Links.create_link(%{
        from_id: t1.id, from_type: "task",
        to_id: t2.id, to_type: "task",
        link_type: "related_to",
        user_id: user.id
      })

      links = Links.list_links_for(t2.id, "task", user.id)
      assert Enum.any?(links, &(&1.link_type == "related_to" && &1.from_id == t2.id))
    end

    test "rejects self-link", %{user: user, t1: t1} do
      assert {:error, :self_link} = Links.create_link(%{
        from_id: t1.id, from_type: "task",
        to_id: t1.id, to_type: "task",
        link_type: "related_to",
        user_id: user.id
      })
    end

    test "rejects link when from entity is not owned by user", %{user: user, t2: t2, t_other: t_other} do
      assert {:error, :unauthorized} = Links.create_link(%{
        from_id: t_other.id, from_type: "task",
        to_id: t2.id, to_type: "task",
        link_type: "related_to",
        user_id: user.id
      })
    end

    test "rejects link when to entity is not owned by user", %{user: user, t1: t1, t_other: t_other} do
      assert {:error, :unauthorized} = Links.create_link(%{
        from_id: t1.id, from_type: "task",
        to_id: t_other.id, to_type: "task",
        link_type: "related_to",
        user_id: user.id
      })
    end
  end

  describe "list_links_for/3" do
    test "returns only links owned by user", %{user: user, other: other, t1: t1, t2: t2, t_other: t_other} do
      {:ok, _} = Links.create_link(%{
        from_id: t1.id, from_type: "task",
        to_id: t2.id, to_type: "task",
        link_type: "related_to",
        user_id: user.id
      })

      {:ok, t_other2} = Tasks.create_task(%{title: "Other2", user_id: other.id})
      {:ok, _} = Links.create_link(%{
        from_id: t_other.id, from_type: "task",
        to_id: t_other2.id, to_type: "task",
        link_type: "related_to",
        user_id: other.id
      })

      links = Links.list_links_for(t1.id, "task", user.id)
      assert Enum.all?(links, &(&1.user_id == user.id))
    end
  end

  describe "list_blocking_links_for_user/1" do
    test "returns only blocks-type links for user", %{user: user, other: other, t1: t1, t2: t2, t_other: t_other} do
      {:ok, _} = Links.create_link(%{
        from_id: t1.id, from_type: "task",
        to_id: t2.id, to_type: "task",
        link_type: "blocks",
        user_id: user.id
      })

      {:ok, t_other2} = Tasks.create_task(%{title: "Other2", user_id: other.id})
      {:ok, _} = Links.create_link(%{
        from_id: t_other.id, from_type: "task",
        to_id: t_other2.id, to_type: "task",
        link_type: "blocks",
        user_id: other.id
      })

      links = Links.list_blocking_links_for_user(user.id)
      assert Enum.all?(links, &(&1.user_id == user.id and &1.link_type == "blocks"))
      assert length(links) == 1
    end
  end

  describe "list_detailed_links_for/3" do
    test "returns task-to-task link with title", %{user: user, t1: t1, t2: t2} do
      {:ok, _} = Links.create_link(%{
        from_id: t1.id, from_type: "task",
        to_id: t2.id, to_type: "task",
        link_type: "related_to",
        user_id: user.id
      })

      links = Links.list_detailed_links_for(t1.id, "task", user.id)
      assert length(links) >= 1
      assert Enum.any?(links, &(&1.target_title == "B" and &1.target_type == "task"))
    end

    test "returns task-to-project link with project title", %{user: user, t1: t1} do
      {:ok, project} = Projects.create_project(%{name: "My Project", user_id: user.id})

      {:ok, _} = Links.create_link(%{
        from_id: t1.id, from_type: "task",
        to_id: project.id, to_type: "project",
        link_type: "related_to",
        user_id: user.id
      })

      links = Links.list_detailed_links_for(t1.id, "task", user.id)
      assert Enum.any?(links, &(&1.target_title == "My Project" and &1.target_type == "project"))
    end
  end

  describe "delete_link/1" do
    test "deletes link and its inverse", %{user: user, t1: t1, t2: t2} do
      {:ok, link} = Links.create_link(%{
        from_id: t1.id, from_type: "task",
        to_id: t2.id, to_type: "task",
        link_type: "blocks",
        user_id: user.id
      })

      {:ok, _} = Links.delete_link(link)

      assert Links.list_links_for(t1.id, "task", user.id) == []
      assert Links.list_links_for(t2.id, "task", user.id) == []
    end
  end
end
