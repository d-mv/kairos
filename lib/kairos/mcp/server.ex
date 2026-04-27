defmodule Kairos.MCP.Server do
  @moduledoc """
  Hermes MCP server exposing Kairos task management tools.

  Authentication is handled by `Kairos.MCP.AuthPlug`, which validates the
  bearer token against the users table and assigns `user_id` to `conn.assigns`.
  Hermes propagates `conn.assigns` into the frame on each request, so
  `frame.assigns.user_id` is always the authenticated user for that request.
  """

  use Hermes.Server,
    name: "kairos",
    version: "1.0.0",
    capabilities: [:tools]

  import Hermes.Server.Frame

  alias Hermes.MCP.Error
  alias Hermes.Server.Response
  alias Kairos.Tasks
  alias Kairos.Projects

  @impl true
  def init(_client_info, frame) do
    frame =
      frame
      |> register_tool("list_tasks",
        description: "List all tasks for the user. Optionally filter by status.",
        input_schema: %{
          status: {:string, description: "Filter by status: pending or completed"}
        }
      )
      |> register_tool("create_task",
        description: "Create a new task in the inbox.",
        input_schema: %{
          title: {:required, :string, description: "Task title"},
          notes: {:string, description: "Optional notes"},
          due_date: {:string, description: "Due date in YYYY-MM-DD format"}
        }
      )
      |> register_tool("update_task",
        description: "Update an existing task's fields.",
        input_schema: %{
          id: {:required, :string, description: "Task ID"},
          title: {:string, description: "New title"},
          notes: {:string, description: "New notes"},
          due_date: {:string, description: "Due date YYYY-MM-DD, or empty string to clear"},
          url: {:string, description: "URL to attach to the task, or empty string to clear"}
        }
      )
      |> register_tool("complete_task",
        description: "Mark a task as completed.",
        input_schema: %{
          id: {:required, :string, description: "Task ID"}
        }
      )
      |> register_tool("reopen_task",
        description: "Reopen a completed task back to pending.",
        input_schema: %{
          id: {:required, :string, description: "Task ID"}
        }
      )
      |> register_tool("delete_task",
        description: "Permanently delete a task.",
        input_schema: %{
          id: {:required, :string, description: "Task ID"}
        }
      )
      |> register_tool("list_projects",
        description: "List all projects for the user.",
        input_schema: %{}
      )
      |> register_tool("create_project",
        description: "Create a new project.",
        input_schema: %{
          name: {:required, :string, description: "Project name"},
          notes: {:string, description: "Optional notes"},
          area_id: {:string, description: "Area ID to place the project in"}
        }
      )
      |> register_tool("promote_task",
        description: "Promote a task to a project. Subtasks become project tasks.",
        input_schema: %{
          id: {:required, :string, description: "Task ID to promote"}
        }
      )
      |> register_tool("demote_project",
        description: "Demote a project to a task. Fails if any task has subtasks.",
        input_schema: %{
          id: {:required, :string, description: "Project ID to demote"}
        }
      )

    {:ok, frame}
  end

  @impl true
  def handle_tool_call("list_tasks", params, frame) do
    user_id = frame.assigns.user_id
    tasks = Tasks.list_tasks(user_id)

    tasks =
      case params[:status] do
        nil -> tasks
        status -> Enum.filter(tasks, &(&1.status == status))
      end

    reply(Jason.encode!(Enum.map(tasks, &task_to_map/1)), frame)
  end

  def handle_tool_call("create_task", params, frame) do
    user_id = frame.assigns.user_id

    attrs = %{
      title: params[:title],
      user_id: user_id,
      notes: params[:notes],
      due_date: parse_date(params[:due_date])
    }

    case Tasks.create_task(attrs) do
      {:ok, task} -> reply(Jason.encode!(task_to_map(task)), frame)
      {:error, changeset} -> error(format_errors(changeset), frame)
    end
  end

  def handle_tool_call("update_task", params, frame) do
    user_id = frame.assigns.user_id

    with {:ok, task} <- fetch_task(params[:id], user_id) do
      attrs =
        %{}
        |> maybe_put(:title, params[:title])
        |> maybe_put(:notes, params[:notes])
        |> maybe_put(:due_date, parse_date(params[:due_date]))
        |> maybe_put(:url, parse_optional_string(params[:url]))

      case Tasks.update_task(task, attrs) do
        {:ok, updated} -> reply(Jason.encode!(task_to_map(updated)), frame)
        {:error, changeset} -> error(format_errors(changeset), frame)
      end
    else
      {:error, msg} -> error(msg, frame)
    end
  end

  def handle_tool_call("complete_task", params, frame) do
    user_id = frame.assigns.user_id

    with {:ok, task} <- fetch_task(params[:id], user_id),
         {:ok, updated} <- Tasks.complete_task(task) do
      reply(Jason.encode!(task_to_map(updated)), frame)
    else
      {:error, msg} when is_binary(msg) -> error(msg, frame)
      {:error, changeset} -> error(format_errors(changeset), frame)
    end
  end

  def handle_tool_call("reopen_task", params, frame) do
    user_id = frame.assigns.user_id

    with {:ok, task} <- fetch_task(params[:id], user_id),
         {:ok, updated} <- Tasks.reopen_task(task) do
      reply(Jason.encode!(task_to_map(updated)), frame)
    else
      {:error, msg} when is_binary(msg) -> error(msg, frame)
      {:error, changeset} -> error(format_errors(changeset), frame)
    end
  end

  def handle_tool_call("delete_task", params, frame) do
    user_id = frame.assigns.user_id

    with {:ok, task} <- fetch_task(params[:id], user_id),
         {:ok, _} <- Tasks.delete_task(task) do
      reply("deleted", frame)
    else
      {:error, msg} when is_binary(msg) -> error(msg, frame)
      {:error, changeset} -> error(format_errors(changeset), frame)
    end
  end

  def handle_tool_call("list_projects", _params, frame) do
    user_id = frame.assigns.user_id
    projects = Projects.list_projects(user_id)
    reply(Jason.encode!(Enum.map(projects, &project_to_map/1)), frame)
  end

  def handle_tool_call("create_project", params, frame) do
    user_id = frame.assigns.user_id

    attrs = %{
      name: params[:name],
      user_id: user_id,
      notes: params[:notes],
      area_id: params[:area_id]
    }

    case Projects.create_project(attrs) do
      {:ok, project} -> reply(Jason.encode!(project_to_map(project)), frame)
      {:error, changeset} -> error(format_errors(changeset), frame)
    end
  end

  def handle_tool_call("promote_task", params, frame) do
    user_id = frame.assigns.user_id

    with {:ok, task} <- fetch_task(params[:id], user_id) do
      case Tasks.promote_to_project(task) do
        {:ok, project} -> reply(Jason.encode!(project_to_map(project)), frame)
        {:error, reason} -> error(inspect(reason), frame)
      end
    else
      {:error, msg} -> error(msg, frame)
    end
  end

  def handle_tool_call("demote_project", params, frame) do
    user_id = frame.assigns.user_id

    with {:ok, project} <- fetch_project(params[:id], user_id) do
      case Projects.demote_to_task(project) do
        {:ok, task} -> reply(Jason.encode!(task_to_map(task)), frame)
        {:error, :has_subtasks} -> error("Cannot demote: project tasks have subtasks", frame)
        {:error, reason} -> error(inspect(reason), frame)
      end
    else
      {:error, msg} -> error(msg, frame)
    end
  end

  # Helpers

  defp reply(text, frame) do
    response = Response.tool() |> Response.text(text)
    {:reply, response, frame}
  end

  defp error(message, frame) do
    {:error, Error.protocol(:internal_error, %{message: message}), frame}
  end

  defp fetch_task(id, user_id) do
    {:ok, Tasks.get_task!(id, user_id)}
  rescue
    _ -> {:error, "Task not found: #{id}"}
  end

  defp fetch_project(id, user_id) do
    {:ok, Projects.get_project!(id, user_id)}
  rescue
    _ -> {:error, "Project not found: #{id}"}
  end

  defp task_to_map(task) do
    %{
      id: task.id,
      title: task.title,
      notes: task.notes,
      status: task.status,
      due_date: task.due_date,
      due_time: task.due_time,
      url: task.url,
      project_id: task.project_id,
      area_id: task.area_id,
      parent_id: task.parent_id
    }
  end

  defp project_to_map(project) do
    %{
      id: project.id,
      name: project.name,
      notes: project.notes,
      status: project.status,
      area_id: project.area_id
    }
  end

  defp parse_date(nil), do: nil
  defp parse_date(""), do: nil

  defp parse_date(str) do
    case Date.from_iso8601(str) do
      {:ok, date} -> date
      _ -> nil
    end
  end

  defp parse_optional_string(nil), do: nil
  defp parse_optional_string(""), do: nil
  defp parse_optional_string(str), do: str

  defp maybe_put(map, _key, nil), do: map
  defp maybe_put(map, key, value), do: Map.put(map, key, value)

  defp format_errors(changeset) do
    changeset
    |> Ecto.Changeset.traverse_errors(fn {msg, opts} ->
      Regex.replace(~r/%{(\w+)}/, msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
    |> inspect()
  end
end
