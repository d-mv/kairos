defmodule Kairos.TasksTest do
  use Kairos.DataCase, async: true

  alias Kairos.Tasks
  alias Kairos.Accounts

  import Kairos.AccountsFixtures

  setup do
    user = user_fixture()
    %{user: user}
  end

  describe "create_task/1" do
    test "creates inbox task with valid attrs", %{user: user} do
      assert {:ok, task} = Tasks.create_task(%{title: "Do laundry", user_id: user.id})
      assert task.title == "Do laundry"
      assert task.status == "pending"
      assert is_nil(task.project_id)
      assert is_nil(task.area_id)
      assert is_nil(task.parent_id)
    end

    test "fails without title", %{user: user} do
      assert {:error, changeset} = Tasks.create_task(%{user_id: user.id})
      assert %{title: ["can't be blank"]} = errors_on(changeset)
    end

    test "creates subtask", %{user: user} do
      {:ok, parent} = Tasks.create_task(%{title: "Parent", user_id: user.id})
      assert {:ok, sub} = Tasks.create_task(%{title: "Child", user_id: user.id, parent_id: parent.id})
      assert sub.parent_id == parent.id
    end

    test "rejects grandchild (max depth 1)", %{user: user} do
      {:ok, parent} = Tasks.create_task(%{title: "Parent", user_id: user.id})
      {:ok, child} = Tasks.create_task(%{title: "Child", user_id: user.id, parent_id: parent.id})
      assert {:error, :max_depth} = Tasks.create_task(%{title: "Grandchild", user_id: user.id, parent_id: child.id})
    end

    test "rejects task belonging to multiple containers", %{user: user} do
      area = area_fixture(user)
      project = project_fixture(user)
      assert {:error, changeset} = Tasks.create_task(%{title: "Bad", user_id: user.id, area_id: area.id, project_id: project.id})
      assert errors_on(changeset)[:base]
    end
  end

  describe "complete_task/1 and reopen_task/1" do
    test "marks task complete", %{user: user} do
      {:ok, task} = Tasks.create_task(%{title: "T", user_id: user.id})
      assert {:ok, completed} = Tasks.complete_task(task)
      assert completed.status == "completed"
    end

    test "reopens completed task", %{user: user} do
      {:ok, task} = Tasks.create_task(%{title: "T", user_id: user.id})
      {:ok, completed} = Tasks.complete_task(task)
      assert {:ok, reopened} = Tasks.reopen_task(completed)
      assert reopened.status == "pending"
    end
  end

  describe "promote_to_project/1" do
    test "promotes task to project, subtasks become project tasks", %{user: user} do
      {:ok, task} = Tasks.create_task(%{title: "Epic", user_id: user.id})
      {:ok, sub} = Tasks.create_task(%{title: "Step", user_id: user.id, parent_id: task.id})

      assert {:ok, project} = Tasks.promote_to_project(task)
      assert project.name == "Epic"

      sub = Kairos.Repo.reload!(sub)
      assert sub.project_id == project.id
      assert is_nil(sub.parent_id)
    end
  end

  describe "list_inbox/1" do
    test "returns tasks with no container", %{user: user} do
      {:ok, t1} = Tasks.create_task(%{title: "Inbox task", user_id: user.id})
      area = area_fixture(user)
      {:ok, _t2} = Tasks.create_task(%{title: "Area task", user_id: user.id, area_id: area.id})

      inbox = Tasks.list_inbox(user.id)
      assert Enum.any?(inbox, &(&1.id == t1.id))
      refute Enum.any?(inbox, &(&1.title == "Area task"))
    end
  end

  defp area_fixture(user) do
    {:ok, area} = Kairos.Areas.create_area(%{name: "Home", user_id: user.id})
    area
  end

  defp project_fixture(user) do
    {:ok, project} = Kairos.Projects.create_project(%{name: "Project", user_id: user.id})
    project
  end
end
