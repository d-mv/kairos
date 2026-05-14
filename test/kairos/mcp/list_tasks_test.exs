defmodule Kairos.MCP.ListTasksTest do
  use Kairos.DataCase, async: true

  alias Kairos.MCP.Server
  alias Kairos.Tasks
  alias Kairos.Projects
  alias Kairos.Areas
  alias Hermes.Server.Frame

  import Kairos.AccountsFixtures

  def project_fixture(attrs) do
    {:ok, project} = Projects.create_project(Enum.into(attrs, %{name: "Test Project"}))
    project
  end

  def area_fixture(attrs) do
    {:ok, area} = Areas.create_area(Enum.into(attrs, %{name: "Test Area"}))
    area
  end

  setup do
    user = user_fixture()
    area = area_fixture(user_id: user.id)
    project = project_fixture(user_id: user.id, area_id: area.id)
    
    {:ok, inbox_task} = Tasks.create_task(%{title: "Inbox task", user_id: user.id})
    {:ok, project_task} = Tasks.create_task(%{title: "Project task", user_id: user.id, project_id: project.id})
    {:ok, area_task} = Tasks.create_task(%{title: "Area task", user_id: user.id, area_id: area.id})
    
    frame = Frame.new(%{user_id: user.id})
    %{user: user, area: area, project: project, inbox_task: inbox_task, project_task: project_task, area_task: area_task, frame: frame}
  end

  test "list_tasks returns error if no filters provided", %{frame: frame} do
    {:reply, response, _frame} = Server.handle_tool_call("list_tasks", %{}, frame)
    assert response.isError == true
    content = List.first(response.content)
    assert content["text"] =~ "Missing filter"
  end

  test "list_tasks filters by project_id", %{project: project, project_task: project_task, frame: frame} do
    {:reply, response, _frame} = Server.handle_tool_call("list_tasks", %{project_id: project.id}, frame)
    content = List.first(response.content)
    tasks = Jason.decode!(content["text"])
    
    assert length(tasks) == 1
    assert List.first(tasks)["id"] == project_task.id
  end

  test "list_tasks filters by area_id", %{area: area, area_task: area_task, frame: frame} do
    {:reply, response, _frame} = Server.handle_tool_call("list_tasks", %{area_id: area.id}, frame)
    content = List.first(response.content)
    tasks = Jason.decode!(content["text"])
    
    assert length(tasks) == 1
    assert List.first(tasks)["id"] == area_task.id
  end

  test "list_tasks filters by inbox", %{inbox_task: inbox_task, frame: frame} do
    {:reply, response, _frame} = Server.handle_tool_call("list_tasks", %{inbox: true}, frame)
    content = List.first(response.content)
    tasks = Jason.decode!(content["text"])
    
    assert length(tasks) == 1
    assert List.first(tasks)["id"] == inbox_task.id
  end

  test "list_tasks handles empty string filters by treating them as nil (returns error)", %{frame: frame} do
    {:reply, response, _frame} = Server.handle_tool_call("list_tasks", %{project_id: ""}, frame)
    assert response.isError == true
    content = List.first(response.content)
    assert content["text"] =~ "Missing filter"
  end
end
