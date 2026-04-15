defmodule Kairos.LinksTest do
  use Kairos.DataCase, async: true

  alias Kairos.Links
  alias Kairos.Tasks

  import Kairos.AccountsFixtures

  setup do
    user = user_fixture()
    {:ok, t1} = Tasks.create_task(%{title: "A", user_id: user.id})
    {:ok, t2} = Tasks.create_task(%{title: "B", user_id: user.id})
    %{user: user, t1: t1, t2: t2}
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

      # inverse must exist
      links = Links.list_links_for(t2.id, "task")
      assert Enum.any?(links, &(&1.link_type == "blocked_by" && &1.from_id == t2.id))
    end

    test "creates related_to and auto-creates symmetric inverse", %{user: user, t1: t1, t2: t2} do
      assert {:ok, _} = Links.create_link(%{
        from_id: t1.id, from_type: "task",
        to_id: t2.id, to_type: "task",
        link_type: "related_to",
        user_id: user.id
      })

      links = Links.list_links_for(t2.id, "task")
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
  end
end
