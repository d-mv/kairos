defmodule Kairos.AreasTest do
  use Kairos.DataCase, async: true

  alias Kairos.{Areas, Tasks, Projects}
  import Kairos.AccountsFixtures

  setup do
    user = user_fixture()
    other = user_fixture()
    %{user: user, other: other}
  end

  describe "list_areas/1" do
    test "returns areas for user ordered by name", %{user: user} do
      {:ok, _} = Areas.create_area(%{name: "Zebra", user_id: user.id})
      {:ok, _} = Areas.create_area(%{name: "Alpha", user_id: user.id})
      areas = Areas.list_areas(user.id)
      assert [%{name: "Alpha"}, %{name: "Zebra"}] = areas
    end

    test "does not return other users areas", %{user: user, other: other} do
      {:ok, _} = Areas.create_area(%{name: "Mine", user_id: user.id})
      {:ok, _} = Areas.create_area(%{name: "Theirs", user_id: other.id})
      areas = Areas.list_areas(user.id)
      assert Enum.all?(areas, &(&1.user_id == user.id))
    end
  end

  describe "get_area!/2" do
    test "returns area for correct user", %{user: user} do
      {:ok, area} = Areas.create_area(%{name: "Found", user_id: user.id})
      assert Areas.get_area!(area.id, user.id).name == "Found"
    end

    test "raises for wrong user", %{user: user, other: other} do
      {:ok, area} = Areas.create_area(%{name: "Owned", user_id: user.id})
      assert_raise Ecto.NoResultsError, fn -> Areas.get_area!(area.id, other.id) end
    end
  end

  describe "create_area/1" do
    test "creates area with valid attrs", %{user: user} do
      assert {:ok, area} = Areas.create_area(%{name: "New Area", user_id: user.id})
      assert area.name == "New Area"
    end

    test "returns error for blank name", %{user: user} do
      assert {:error, changeset} = Areas.create_area(%{name: "", user_id: user.id})
      assert errors_on(changeset).name
    end
  end

  describe "update_area/2" do
    test "updates name", %{user: user} do
      {:ok, area} = Areas.create_area(%{name: "Old", user_id: user.id})
      assert {:ok, updated} = Areas.update_area(area, %{name: "New"})
      assert updated.name == "New"
    end

    test "rejects blank name", %{user: user} do
      {:ok, area} = Areas.create_area(%{name: "Name", user_id: user.id})
      assert {:error, _} = Areas.update_area(area, %{name: ""})
    end
  end

  describe "delete_area/1" do
    test "deletes the area", %{user: user} do
      {:ok, area} = Areas.create_area(%{name: "Gone", user_id: user.id})
      assert {:ok, _} = Areas.delete_area(area)
      assert_raise Ecto.NoResultsError, fn -> Areas.get_area!(area.id, user.id) end
    end
  end

  describe "count_tasks/1" do
    test "counts tasks in area", %{user: user} do
      {:ok, area} = Areas.create_area(%{name: "Counted", user_id: user.id})
      {:ok, _} = Tasks.create_task(%{title: "T1", user_id: user.id, area_id: area.id})
      {:ok, _} = Tasks.create_task(%{title: "T2", user_id: user.id, area_id: area.id})
      assert Areas.count_tasks(area.id) == 2
    end

    test "returns 0 for empty area", %{user: user} do
      {:ok, area} = Areas.create_area(%{name: "Empty", user_id: user.id})
      assert Areas.count_tasks(area.id) == 0
    end
  end

  describe "count_projects/1" do
    test "counts projects in area", %{user: user} do
      {:ok, area} = Areas.create_area(%{name: "WithProjects", user_id: user.id})
      {:ok, _} = Projects.create_project(%{name: "P1", user_id: user.id, area_id: area.id})
      assert Areas.count_projects(area.id) == 1
    end
  end

end
