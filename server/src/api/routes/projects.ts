import type { FastifyInstance } from "fastify";
import * as container from "../container.js";

export async function projectRoutes(fastify: FastifyInstance) {
  // GET /api/v1/projects
  fastify.get("/", async (req, reply) => {
    const result = await container.listProjects.execute(req.userId);
    return result.isOk ? result.value : reply.status(500).send({ error: result.error });
  });

  // POST /api/v1/projects
  fastify.post<{ Body: { name: string; areaId?: string } }>("/", async (req, reply) => {
    const result = await container.createProject.execute({
      name: req.body.name,
      userId: req.userId,
      areaId: req.body.areaId,
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
    const result = await container.updateProject.execute({
      id: req.params.id,
      userId: req.userId,
      ...req.body,
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
