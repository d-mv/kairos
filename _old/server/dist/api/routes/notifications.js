import * as container from "../container.js";
export async function notificationRoutes(fastify) {
    fastify.get("/", async (req, reply) => {
        const result = await container.listNotifications.execute(req.userId);
        if (result.isErr)
            return reply.status(500).send({ error: result.error });
        return result.value;
    });
    fastify.post("/:id/accept", async (req, reply) => {
        const result = await container.respondToInvite.accept(req.params.id, req.userId);
        if (result.isErr)
            return reply.status(400).send({ error: result.error });
        return { ok: true };
    });
    fastify.post("/:id/decline", async (req, reply) => {
        const result = await container.respondToInvite.decline(req.params.id, req.userId);
        if (result.isErr)
            return reply.status(400).send({ error: result.error });
        return { ok: true };
    });
}
//# sourceMappingURL=notifications.js.map