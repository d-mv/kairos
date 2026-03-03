import type { TaskDurationUnit, TaskPriority } from "@kairos/shared";
import type { FastifyInstance } from "fastify";
import * as container from "../container.js";

export async function taskRoutes(fastify: FastifyInstance) {
  // GET /api/v1/tasks
  fastify.get<{
    Querystring: {
      projectId?: string;
      areaId?: string;
      inbox?: string;
      parentTaskId?: string;
    };
  }>("/", async (req, reply) => {
    const result = await container.listTasks.execute({
      userId: req.userId,
      projectId: req.query.projectId,
      areaId: req.query.areaId,
      inbox: req.query.inbox === "true",
      parentTaskId: req.query.parentTaskId,
    });
    return result.isOk ? result.value : reply.status(500).send({ error: result.error });
  });

  // POST /api/v1/tasks
  fastify.post<{
    Body: {
      title: string;
      description?: string;
      priority?: TaskPriority;
      projectId?: string;
      areaId?: string;
      parentTaskId?: string;
      dueDate?: string;
      duration?: number;
      durationUnit?: TaskDurationUnit;
    };
  }>("/", async (req, reply) => {
    try {
      const result = await container.createTask.execute({
        ...req.body,
        userId: req.userId,
      });
      if (result.isErr) return reply.status(400).send({ error: result.error });
      return reply.status(201).send(result.value);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create task";
      req.log.error({ err }, "Create task failed");
      return reply.status(500).send({ error: message });
    }
  });

  // GET /api/v1/tasks/:id
  fastify.get<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const all = await container.listTasks.execute({ userId: req.userId });
    if (all.isErr) return reply.status(500).send({ error: all.error });
    const task = all.value.find((t) => t.id === req.params.id);
    if (!task) return reply.status(404).send({ error: "Task not found" });
    return task;
  });

  // PUT /api/v1/tasks/:id
  fastify.put<{
    Params: { id: string };
    Body: {
      title?: string;
      description?: string | null;
      priority?: TaskPriority;
      projectId?: string | null;
      areaId?: string | null;
      dueDate?: string | null;
      duration?: number | null;
      durationUnit?: TaskDurationUnit | null;
    };
  }>("/:id", async (req, reply) => {
    const result = await container.updateTask.execute({
      id: req.params.id,
      userId: req.userId,
      ...req.body,
    });
    if (result.isErr) return reply.status(400).send({ error: result.error });
    return result.value;
  });

  // DELETE /api/v1/tasks/:id
  fastify.delete<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const result = await container.deleteTask.execute(req.params.id, req.userId);
    if (result.isErr) return reply.status(404).send({ error: result.error });
    return reply.status(204).send();
  });

  // POST /api/v1/tasks/:id/complete
  fastify.post<{ Params: { id: string } }>("/:id/complete", async (req, reply) => {
    const result = await container.completeTask.execute(req.params.id, req.userId);
    if (result.isErr) return reply.status(400).send({ error: result.error });
    return result.value;
  });

  // POST /api/v1/tasks/:id/reopen
  fastify.post<{ Params: { id: string } }>("/:id/reopen", async (req, reply) => {
    const result = await container.reopenTask.execute(req.params.id, req.userId);
    if (result.isErr) return reply.status(400).send({ error: result.error });
    return result.value;
  });

  // POST /api/v1/tasks/:id/promote
  fastify.post<{ Params: { id: string } }>("/:id/promote", async (req, reply) => {
    try {
      const result = await container.promoteTask.execute(req.params.id, req.userId);
      if (result.isErr) return reply.status(400).send({ error: result.error });
      return result.value;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to promote task";
      req.log.error({ err }, "Promote task failed");
      return reply.status(500).send({ error: message });
    }
  });
}
