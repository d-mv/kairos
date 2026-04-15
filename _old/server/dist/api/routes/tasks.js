import { z } from "zod";
import * as container from "../container.js";
const taskPrioritySchema = z
    .number()
    .refine((value) => [1, 2, 3, 4].includes(value), "Invalid task priority");
const taskDurationUnitSchema = z.union([
    z.literal("h"),
    z.literal("d"),
    z.literal("w"),
    z.literal("m"),
]);
const taskTagsSchema = z.array(z.string());
const createTaskSchema = z.object({
    title: z.string().trim().min(1, "Task title is required"),
    description: z.string().optional(),
    priority: taskPrioritySchema.optional(),
    projectId: z.string().optional(),
    areaId: z.string().optional(),
    parentTaskId: z.string().optional(),
    dueDate: z.string().optional(),
    duration: z.number().optional(),
    durationUnit: taskDurationUnitSchema.optional(),
    tags: taskTagsSchema.optional(),
});
const updateTaskSchema = z.object({
    title: z.string().trim().min(1, "Task title is required").optional(),
    description: z.union([z.string(), z.null()]).optional(),
    priority: taskPrioritySchema.optional(),
    projectId: z.union([z.string(), z.null()]).optional(),
    areaId: z.union([z.string(), z.null()]).optional(),
    dueDate: z.union([z.string(), z.null()]).optional(),
    duration: z.union([z.number(), z.null()]).optional(),
    durationUnit: z.union([taskDurationUnitSchema, z.null()]).optional(),
    tags: taskTagsSchema.optional(),
});
const moveTaskSchema = z.object({
    afterId: z.union([z.string(), z.null()]),
});
export async function taskRoutes(fastify) {
    // GET /api/v1/tasks
    fastify.get("/", async (req, reply) => {
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
    fastify.post("/", async (req, reply) => {
        const parsed = createTaskSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            return reply.status(400).send({ error: issue?.message ?? "Invalid task payload" });
        }
        try {
            const result = await container.createTask.execute({
                ...parsed.data,
                userId: req.userId,
            });
            if (result.isErr)
                return reply.status(400).send({ error: result.error });
            return reply.status(201).send(result.value);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "Failed to create task";
            req.log.error({ err }, "Create task failed");
            return reply.status(500).send({ error: message });
        }
    });
    // GET /api/v1/tasks/:id
    fastify.get("/:id", async (req, reply) => {
        const all = await container.listTasks.execute({ userId: req.userId });
        if (all.isErr)
            return reply.status(500).send({ error: all.error });
        const task = all.value.find((t) => t.id === req.params.id);
        if (!task)
            return reply.status(404).send({ error: "Task not found" });
        return task;
    });
    // PUT /api/v1/tasks/:id
    fastify.put("/:id", async (req, reply) => {
        const parsed = updateTaskSchema.safeParse(req.body);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            return reply.status(400).send({ error: issue?.message ?? "Invalid task update payload" });
        }
        const result = await container.updateTask.execute({
            id: req.params.id,
            userId: req.userId,
            ...parsed.data,
        });
        if (result.isErr)
            return reply.status(400).send({ error: result.error });
        return result.value;
    });
    // DELETE /api/v1/tasks/:id
    fastify.delete("/:id", async (req, reply) => {
        const result = await container.deleteTask.execute(req.params.id, req.userId);
        if (result.isErr)
            return reply.status(404).send({ error: result.error });
        return reply.status(204).send();
    });
    // POST /api/v1/tasks/:id/complete
    fastify.post("/:id/complete", async (req, reply) => {
        const result = await container.completeTask.execute(req.params.id, req.userId);
        if (result.isErr)
            return reply.status(400).send({ error: result.error });
        return result.value;
    });
    // POST /api/v1/tasks/:id/reopen
    fastify.post("/:id/reopen", async (req, reply) => {
        const result = await container.reopenTask.execute(req.params.id, req.userId);
        if (result.isErr)
            return reply.status(400).send({ error: result.error });
        return result.value;
    });
    // PUT /api/v1/tasks/:id/move
    fastify.put("/:id/move", async (req, reply) => {
        const parsed = moveTaskSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: "Invalid task move target" });
        }
        const result = await container.reorderTask.execute({
            taskId: req.params.id,
            afterId: parsed.data.afterId,
            userId: req.userId,
        });
        if (result.isErr)
            return reply.status(400).send({ error: result.error });
        return result.value;
    });
    // POST /api/v1/tasks/:id/promote
    fastify.post("/:id/promote", async (req, reply) => {
        try {
            const result = await container.promoteTask.execute(req.params.id, req.userId);
            if (result.isErr)
                return reply.status(400).send({ error: result.error });
            return result.value;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "Failed to promote task";
            req.log.error({ err }, "Promote task failed");
            return reply.status(500).send({ error: message });
        }
    });
}
//# sourceMappingURL=tasks.js.map