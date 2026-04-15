import * as container from "../container.js";
export async function brainRoutes(fastify) {
    fastify.get("/", async (req, reply) => {
        const [foldersResult, pagesResult] = await Promise.all([
            container.listBrainFolders.execute(req.userId),
            container.listBrainPages.execute(req.userId),
        ]);
        if (foldersResult.isErr)
            return reply.status(500).send({ error: foldersResult.error });
        if (pagesResult.isErr)
            return reply.status(500).send({ error: pagesResult.error });
        return { folders: foldersResult.value, pages: pagesResult.value };
    });
    fastify.post("/folders", async (req, reply) => {
        const result = await container.createBrainFolder.execute({
            name: req.body.name,
            userId: req.userId,
        });
        if (result.isErr)
            return reply.status(400).send({ error: result.error });
        return reply.status(201).send(result.value);
    });
    fastify.post("/pages", async (req, reply) => {
        const result = await container.createBrainPage.execute({
            title: req.body.title,
            folderId: req.body.folderId,
            contentJson: req.body.contentJson,
            userId: req.userId,
        });
        if (result.isErr)
            return reply.status(400).send({ error: result.error });
        return reply.status(201).send(result.value);
    });
    fastify.put("/pages/:id", async (req, reply) => {
        const result = await container.updateBrainPage.execute({
            id: req.params.id,
            title: req.body.title,
            folderId: req.body.folderId,
            contentJson: req.body.contentJson,
            userId: req.userId,
        });
        if (result.isErr)
            return reply.status(400).send({ error: result.error });
        return result.value;
    });
    fastify.delete("/pages/:id", async (req, reply) => {
        const result = await container.deleteBrainPage.execute({
            id: req.params.id,
            userId: req.userId,
        });
        if (result.isErr)
            return reply.status(404).send({ error: result.error });
        return reply.status(204).send();
    });
}
//# sourceMappingURL=brain.js.map