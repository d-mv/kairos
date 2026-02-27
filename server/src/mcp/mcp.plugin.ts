import type { FastifyInstance } from "fastify";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import * as container from "../api/container.js";

export async function mcpPlugin(fastify: FastifyInstance) {
  const server = new Server({ name: "kairos", version: "0.1.0" }, { capabilities: { tools: {} } });

  // ── Tool definitions ────────────────────────────────────────────────────
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "list_tasks",
        description: "List tasks. Filter by projectId, areaId, inbox=true, or parentTaskId.",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string" },
            projectId: { type: "string" },
            areaId: { type: "string" },
            inbox: { type: "boolean" },
            parentTaskId: { type: "string" },
          },
          required: ["userId"],
        },
      },
      {
        name: "create_task",
        description: "Create a new task.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            userId: { type: "string" },
            description: { type: "string" },
            priority: { type: "number", enum: [1, 2, 3, 4] },
            projectId: { type: "string" },
            areaId: { type: "string" },
            parentTaskId: { type: "string" },
            dueDate: { type: "string" },
            duration: { type: "number" },
            durationUnit: { type: "string", enum: ["h", "d", "w", "m"] },
          },
          required: ["title", "userId"],
        },
      },
      {
        name: "update_task",
        description: "Update an existing task.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            priority: { type: "number" },
            projectId: { type: "string" },
            areaId: { type: "string" },
            dueDate: { type: "string" },
            duration: { type: "number" },
            durationUnit: { type: "string", enum: ["h", "d", "w", "m"] },
          },
          required: ["id", "userId"],
        },
      },
      {
        name: "delete_task",
        description: "Delete a task.",
        inputSchema: {
          type: "object",
          properties: { id: { type: "string" }, userId: { type: "string" } },
          required: ["id", "userId"],
        },
      },
      {
        name: "complete_task",
        description: "Mark a task as completed.",
        inputSchema: {
          type: "object",
          properties: { id: { type: "string" }, userId: { type: "string" } },
          required: ["id", "userId"],
        },
      },
      {
        name: "promote_task",
        description: "Promote a task to a project. Subtasks become project tasks.",
        inputSchema: {
          type: "object",
          properties: { id: { type: "string" }, userId: { type: "string" } },
          required: ["id", "userId"],
        },
      },
      {
        name: "list_projects",
        description: "List all projects.",
        inputSchema: {
          type: "object",
          properties: { userId: { type: "string" } },
          required: ["userId"],
        },
      },
      {
        name: "create_project",
        description: "Create a new project.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            userId: { type: "string" },
            areaId: { type: "string" },
          },
          required: ["name", "userId"],
        },
      },
      {
        name: "demote_project",
        description: "Demote a project to a task. Fails if any task has subtasks.",
        inputSchema: {
          type: "object",
          properties: { id: { type: "string" }, userId: { type: "string" } },
          required: ["id", "userId"],
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
            userId: { type: "string" },
          },
          required: ["sourceId", "sourceType", "targetId", "targetType", "linkType", "userId"],
        },
      },
    ],
  }));

  // ── Tool execution ──────────────────────────────────────────────────────
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const a = args as Record<string, unknown>;

    try {
      let result;

      switch (name) {
        case "list_tasks":
          result = await container.listTasks.execute({
            userId: a["userId"] as string,
            projectId: a["projectId"] as string | undefined,
            areaId: a["areaId"] as string | undefined,
            inbox: a["inbox"] as boolean | undefined,
            parentTaskId: a["parentTaskId"] as string | undefined,
          });
          break;

        case "create_task":
          result = await container.createTask.execute({
            title: a["title"] as string,
            userId: a["userId"] as string,
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
            userId: a["userId"] as string,
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
          result = await container.deleteTask.execute(a["id"] as string, a["userId"] as string);
          break;

        case "complete_task":
          result = await container.completeTask.execute(a["id"] as string, a["userId"] as string);
          break;

        case "promote_task":
          result = await container.promoteTask.execute(a["id"] as string, a["userId"] as string);
          break;

        case "list_projects":
          result = await container.listProjects.execute(a["userId"] as string);
          break;

        case "create_project":
          result = await container.createProject.execute({
            name: a["name"] as string,
            userId: a["userId"] as string,
            areaId: a["areaId"] as string | undefined,
          });
          break;

        case "demote_project":
          result = await container.demoteProject.execute(a["id"] as string, a["userId"] as string);
          break;

        case "create_link":
          result = await container.createLink.execute({
            sourceId: a["sourceId"] as string,
            sourceType: a["sourceType"] as "task" | "project",
            targetId: a["targetId"] as string,
            targetType: a["targetType"] as "task" | "project",
            linkType: a["linkType"] as "blocks" | "blocked_by" | "related_to",
            userId: a["userId"] as string,
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

  fastify.log.info("MCP plugin registered");
}
