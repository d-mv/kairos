import * as container from "../container.js";
export async function linkRoutes(fastify) {
    // POST /api/v1/links
    fastify.post("/", async (req, reply) => {
        const result = await container.createLink.execute({
            ...req.body,
            userId: req.userId,
        });
        if (result.isErr)
            return reply.status(400).send({ error: result.error });
        return reply.status(201).send(result.value);
    });
    // DELETE /api/v1/links/:id
    fastify.delete("/:id", async (req, reply) => {
        const result = await container.deleteLink.execute(req.params.id, req.userId);
        if (result.isErr)
            return reply.status(404).send({ error: result.error });
        return reply.status(204).send();
    });
}
//# sourceMappingURL=links.js.map