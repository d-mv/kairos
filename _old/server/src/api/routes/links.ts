import type { FastifyInstance } from "fastify";
import type { LinkType, EntityType } from "@kairos/shared";
import * as container from "../container.js";

export async function linkRoutes(fastify: FastifyInstance) {
  // POST /api/v1/links
  fastify.post<{
    Body: {
      sourceId: string;
      sourceType: EntityType;
      targetId: string;
      targetType: EntityType;
      linkType: LinkType;
    };
  }>("/", async (req, reply) => {
    const result = await container.createLink.execute({
      ...req.body,
      userId: req.userId,
    });
    if (result.isErr) return reply.status(400).send({ error: result.error });
    return reply.status(201).send(result.value);
  });

  // DELETE /api/v1/links/:id
  fastify.delete<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const result = await container.deleteLink.execute(req.params.id, req.userId);
    if (result.isErr) return reply.status(404).send({ error: result.error });
    return reply.status(204).send();
  });
}
