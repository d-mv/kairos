import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import * as container from "../api/container.js";

type KairosMcpServerOptions = {
  getUserId: () => string | undefined;
};

export function createKairosMcpServer({ getUserId }: KairosMcpServerOptions) {
  const server = new Server({ name: "kairos", version: "0.1.0" }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "list_tasks",
        description: "List tasks. Filter by projectId, areaId, inbox=true, or parentTaskId.",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "string" },
            areaId: { type: "string" },
            inbox: { type: "boolean" },
            parentTaskId: { type: "string" },
          },
        },
      },
      {
        name: "create_task",
        description: "Create a new task.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            priority: { type: "number", enum: [1, 2, 3, 4] },
            projectId: { type: "string" },
            areaId: { type: "string" },
            parentTaskId: { type: "string" },
            dueDate: { type: "string" },
            duration: { type: "number" },
            durationUnit: { type: "string", enum: ["h", "d", "w", "m"] },
          },
          required: ["title"],
        },
      },
      {
        name: "update_task",
        description: "Update an existing task.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            priority: { type: "number" },
            projectId: { type: "string" },
            areaId: { type: "string" },
            dueDate: { type: "string" },
            duration: { type: "number" },
            durationUnit: { type: "string", enum: ["h", "d", "w", "m"] },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_task",
        description: "Delete a task.",
        inputSchema: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
      },
      {
        name: "complete_task",
        description: "Mark a task as completed.",
        inputSchema: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
      },
      {
        name: "promote_task",
        description: "Promote a task to a project. Subtasks become project tasks.",
        inputSchema: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
      },
      {
        name: "list_projects",
        description: "List all projects.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "create_project",
        description: "Create a new project.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            areaId: { type: "string" },
          },
          required: ["name"],
        },
      },
      {
        name: "demote_project",
        description: "Demote a project to a task. Fails if any task has subtasks.",
        inputSchema: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
      },
      {
        name: "create_link",
        description: "Create a link between two entities (blocks, blocked_by, related_to).",
        inputSchema: {
          type: "object",
          properties: {
            sourceId: { type: "string" },
            sourceType: { type: "string", enum: ["task", "project"] },
            targetId: { type: "string" },
            targetType: { type: "string", enum: ["task", "project"] },
            linkType: { type: "string", enum: ["blocks", "blocked_by", "related_to"] },
          },
          required: ["sourceId", "sourceType", "targetId", "targetType", "linkType"],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const a = args as Record<string, unknown>;
    const userId = getUserId();

    if (!userId) {
      return {
        content: [{ type: "text", text: "Missing authenticated user context for Kairos MCP" }],
        isError: true,
      };
    }

    try {
      let result;

      switch (name) {
        case "list_tasks":
          result = await container.listTasks.execute({
            userId,
            projectId: a["projectId"] as string | undefined,
            areaId: a["areaId"] as string | undefined,
            inbox: a["inbox"] as boolean | undefined,
            parentTaskId: a["parentTaskId"] as string | undefined,
          });
          break;

        case "create_task":
          result = await container.createTask.execute({
            title: a["title"] as string,
            userId,
            description: a["description"] as string | undefined,
            priority: a["priority"] as 1 | 2 | 3 | 4 | undefined,
            projectId: a["projectId"] as string | undefined,
            areaId: a["areaId"] as string | undefined,
            parentTaskId: a["parentTaskId"] as string | undefined,
            dueDate: a["dueDate"] as string | undefined,
            duration: a["duration"] as number | undefined,
            durationUnit: a["durationUnit"] as "h" | "d" | "w" | "m" | undefined,
          });
          break;

        case "update_task":
          result = await container.updateTask.execute({
            id: a["id"] as string,
            userId,
            title: a["title"] as string | undefined,
            description: a["description"] as string | null | undefined,
            priority: a["priority"] as 1 | 2 | 3 | 4 | undefined,
            projectId: a["projectId"] as string | null | undefined,
            areaId: a["areaId"] as string | null | undefined,
            dueDate: a["dueDate"] as string | null | undefined,
            duration: a["duration"] as number | null | undefined,
            durationUnit: a["durationUnit"] as "h" | "d" | "w" | "m" | null | undefined,
          });
          break;

        case "delete_task":
          result = await container.deleteTask.execute(a["id"] as string, userId);
          break;

        case "complete_task":
          result = await container.completeTask.execute(a["id"] as string, userId);
          break;

        case "promote_task":
          result = await container.promoteTask.execute(a["id"] as string, userId);
          break;

        case "list_projects":
          result = await container.listProjects.execute(userId);
          break;

        case "create_project":
          result = await container.createProject.execute({
            name: a["name"] as string,
            userId,
            areaId: a["areaId"] as string | undefined,
          });
          break;

        case "demote_project":
          result = await container.demoteProject.execute(a["id"] as string, userId);
          break;

        case "create_link":
          result = await container.createLink.execute({
            sourceId: a["sourceId"] as string,
            sourceType: a["sourceType"] as "task" | "project",
            targetId: a["targetId"] as string,
            targetType: a["targetType"] as "task" | "project",
            linkType: a["linkType"] as "blocks" | "blocked_by" | "related_to",
            userId,
          });
          break;

        default:
          return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
      }

      if (result.isErr) {
        return { content: [{ type: "text", text: `Error: ${result.error}` }], isError: true };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result.value, null, 2) }],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { content: [{ type: "text", text: `Unexpected error: ${msg}` }], isError: true };
    }
  });

  return server;
}
