defmodule Kairos.ProjectsTest do
  use Kairos.DataCase, async: true

  alias Kairos.Projects
  alias Kairos.Tasks

  import Kairos.AccountsFixtures

  setup do
    user = user_fixture()
    %{user: user}
  end

  describe "create_project/1" do
    test "creates project", %{user: user} do
      assert {:ok, project} = Projects.create_project(%{name: "Work", user_id: user.id})
      assert project.name == "Work"
      assert project.status == "active"
    end

    test "fails without name", %{user: user} do
      assert {:error, changeset} = Projects.create_project(%{user_id: user.id})
      assert %{name: ["can't be blank"]} = errors_on(changeset)
    end
  end

  describe "complete_project/1 and reopen_project/1" do
    test "marks project as completed", %{user: user} do
      {:ok, project} = Projects.create_project(%{name: "Done", user_id: user.id})
      assert {:ok, completed} = Projects.complete_project(project)
      assert completed.status == "completed"
    end

    test "reopens completed project to active", %{user: user} do
      {:ok, project} = Projects.create_project(%{name: "Done", user_id: user.id})
      {:ok, completed} = Projects.complete_project(project)
      assert {:ok, reopened} = Projects.reopen_project(completed)
      assert reopened.status == "active"
    end
  end

  describe "demote_to_task/1" do
    test "demotes project with no tasks-with-subtasks to task", %{user: user} do
      {:ok, project} = Projects.create_project(%{name: "Simple", user_id: user.id})
      {:ok, _t} = Tasks.create_task(%{title: "Plain task", user_id: user.id, project_id: project.id})

      assert {:ok, task} = Projects.demote_to_task(project)
      assert task.title == "Simple"
    end

    test "blocks demotion when project tasks have subtasks", %{user: user} do
      {:ok, project} = Projects.create_project(%{name: "Complex", user_id: user.id})
      {:ok, task} = Tasks.create_task(%{title: "Has sub", user_id: user.id, project_id: project.id})
      {:ok, _sub} = Tasks.create_task(%{title: "Sub", user_id: user.id, parent_id: task.id})

      assert {:error, :has_subtasks} = Projects.demote_to_task(project)
    end
  end
end
