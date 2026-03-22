import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as container from "../container.js";

const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required"),
  areaId: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").optional(),
  areaId: z.union([z.string(), z.null()]).optional(),
  completedAt: z.union([z.string(), z.null()]).optional(),
});

export async function projectRoutes(fastify: FastifyInstance) {
  // GET /api/v1/projects
  fastify.get("/", async (req, reply) => {
    const result = await container.listProjects.execute(req.userId);
    return result.isOk ? result.value : reply.status(500).send({ error: result.error });
  });

  // POST /api/v1/projects
  fastify.post<{ Body: { name: string; areaId?: string } }>("/", async (req, reply) => {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid project payload" });
    }

    const result = await container.createProject.execute({
      name: parsed.data.name,
      userId: req.userId,
      areaId: parsed.data.areaId,
    });
    if (result.isErr) return reply.status(400).send({ error: result.error });
    return reply.status(201).send(result.value);
  });

  // GET /api/v1/projects/:id
  fastify.get<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const all = await container.listProjects.execute(req.userId);
    if (all.isErr) return reply.status(500).send({ error: all.error });
    const project = all.value.find((p) => p.id === req.params.id);
    if (!project) return reply.status(404).send({ error: "Project not found" });
    return project;
  });

  // PUT /api/v1/projects/:id
  fastify.put<{
    Params: { id: string };
    Body: { name?: string; areaId?: string | null; completedAt?: string | null };
  }>("/:id", async (req, reply) => {
    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid project update payload" });
    }

    const result = await container.updateProject.execute({
      id: req.params.id,
      userId: req.userId,
      ...parsed.data,
    });
    if (result.isErr) return reply.status(400).send({ error: result.error });
    return result.value;
  });

  // DELETE /api/v1/projects/:id
  fastify.delete<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const result = await container.deleteProject.execute(req.params.id, req.userId);
    if (result.isErr) return reply.status(404).send({ error: result.error });
    return reply.status(204).send();
  });

  // POST /api/v1/projects/:id/demote
  fastify.post<{ Params: { id: string } }>("/:id/demote", async (req, reply) => {
    const result = await container.demoteProject.execute(req.params.id, req.userId);
    if (result.isErr) return reply.status(400).send({ error: result.error });
    return reply.status(200).send(result.value);
  });
}
