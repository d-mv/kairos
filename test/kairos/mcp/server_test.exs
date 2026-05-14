defmodule Kairos.MCP.ServerTest do
  use Kairos.DataCase, async: true

  alias Kairos.MCP.Server
  alias Kairos.Tasks
  alias Kairos.Projects
  alias Hermes.Server.Frame

  import Kairos.AccountsFixtures

  setup do
    user = user_fixture()
    {:ok, task} = Tasks.create_task(%{title: "Test task", user_id: user.id})
    frame = Frame.new(%{user_id: user.id})
    Phoenix.PubSub.subscribe(Kairos.PubSub, "user:#{user.id}")
    %{user: user, task: task, frame: frame}
  end

  describe "complete_task broadcasts PubSub" do
    test "broadcasts tasks_changed after completing", %{task: task, frame: frame} do
      Server.handle_tool_call("complete_task", %{id: task.id}, frame)
      assert_receive {:tasks_changed, nil}, 1000
    end

    test "task is actually completed in DB", %{task: task, frame: frame, user: user} do
      Server.handle_tool_call("complete_task", %{id: task.id}, frame)
      updated = Tasks.get_task!(task.id, user.id)
      assert updated.status == "completed"
    end
  end

  describe "reopen_task broadcasts PubSub" do
    setup %{task: task} do
      {:ok, completed} = Tasks.complete_task(task)
      %{task: completed}
    end

    test "broadcasts tasks_changed after reopening", %{task: task, frame: frame} do
      Server.handle_tool_call("reopen_task", %{id: task.id}, frame)
      assert_receive {:tasks_changed, nil}, 1000
    end

    test "task is actually reopened in DB", %{task: task, frame: frame, user: user} do
      Server.handle_tool_call("reopen_task", %{id: task.id}, frame)
      updated = Tasks.get_task!(task.id, user.id)
      assert updated.status == "pending"
    end
  end

  describe "create_task broadcasts PubSub" do
    test "broadcasts tasks_changed after creating", %{frame: frame} do
      Server.handle_tool_call("create_task", %{title: "New task", inbox: true}, frame)
      assert_receive {:tasks_changed, nil}, 1000
    end
  end

  describe "update_task broadcasts PubSub" do
    test "broadcasts tasks_changed after updating", %{task: task, frame: frame} do
      Server.handle_tool_call("update_task", %{id: task.id, title: "Updated"}, frame)
      assert_receive {:tasks_changed, nil}, 1000
    end
  end

  describe "delete_task broadcasts PubSub" do
    test "broadcasts tasks_changed after deleting", %{task: task, frame: frame} do
      Server.handle_tool_call("delete_task", %{id: task.id}, frame)
      assert_receive {:tasks_changed, nil}, 1000
    end
  end

  describe "update_project broadcasts PubSub" do
    def project_fixture(attrs) do
      {:ok, project} = Projects.create_project(Enum.into(attrs, %{name: "Test Project"}))
      project
    end

    test "broadcasts tasks_changed after updating project", %{user: user, frame: frame} do
      project = project_fixture(user_id: user.id)
      Server.handle_tool_call("update_project", %{id: project.id, name: "Updated Name"}, frame)
      assert_receive {:tasks_changed, nil}, 1000
    end

    test "project is actually updated in DB", %{user: user, frame: frame} do
      project = project_fixture(user_id: user.id)
      Server.handle_tool_call("update_project", %{id: project.id, name: "Updated Name"}, frame)
      updated = Projects.get_project!(project.id, user.id)
      assert updated.name == "Updated Name"
    end
  end
end
