import type { ShareEntityType } from "@kairos/shared";
import type { FastifyInstance } from "fastify";
import * as container from "../container.js";

export async function collaborationRoutes(fastify: FastifyInstance) {
  fastify.post<{
    Body: {
      recipientEmail: string;
      entityType: ShareEntityType;
      entityId: string;
    };
  }>("/invites", async (req, reply) => {
    const result = await container.createCollaborationInvite.execute({
      senderUserId: req.userId,
      recipientEmail: req.body.recipientEmail,
      entityType: req.body.entityType,
      entityId: req.body.entityId,
    });

    if (result.isErr) return reply.status(400).send({ error: result.error });
    return reply.status(201).send({ ok: true });
  });
}
