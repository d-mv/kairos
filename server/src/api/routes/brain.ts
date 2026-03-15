import type { BrainContent } from "@kairos/shared";
import type { FastifyInstance } from "fastify";
import * as container from "../container.js";

export async function brainRoutes(fastify: FastifyInstance) {
  fastify.get("/", async (req, reply) => {
    const [foldersResult, pagesResult] = await Promise.all([
      container.listBrainFolders.execute(req.userId),
      container.listBrainPages.execute(req.userId),
    ]);

    if (foldersResult.isErr) return reply.status(500).send({ error: foldersResult.error });
    if (pagesResult.isErr) return reply.status(500).send({ error: pagesResult.error });

    return { folders: foldersResult.value, pages: pagesResult.value };
  });

  fastify.post<{ Body: { name: string } }>("/folders", async (req, reply) => {
    const result = await container.createBrainFolder.execute({
      name: req.body.name,
      userId: req.userId,
    });
    if (result.isErr) return reply.status(400).send({ error: result.error });
    return reply.status(201).send(result.value);
  });

  fastify.post<{ Body: { title: string; folderId?: string | null; contentJson?: BrainContent } }>(
    "/pages",
    async (req, reply) => {
      const result = await container.createBrainPage.execute({
        title: req.body.title,
        folderId: req.body.folderId,
        contentJson: req.body.contentJson,
        userId: req.userId,
      });
      if (result.isErr) return reply.status(400).send({ error: result.error });
      return reply.status(201).send(result.value);
    },
  );

  fastify.put<{
    Params: { id: string };
    Body: { title?: string; folderId?: string | null; contentJson?: BrainContent };
  }>("/pages/:id", async (req, reply) => {
    const result = await container.updateBrainPage.execute({
      id: req.params.id,
      title: req.body.title,
      folderId: req.body.folderId,
      contentJson: req.body.contentJson,
      userId: req.userId,
    });
    if (result.isErr) return reply.status(400).send({ error: result.error });
    return result.value;
  });
}
