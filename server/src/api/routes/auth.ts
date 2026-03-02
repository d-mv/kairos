import type { FastifyInstance } from "fastify";
import * as container from "../container.js";
import { generateApiKey, hashApiKey, previewApiKey } from "../../auth/apiKeys.js";

export async function authRoutes(fastify: FastifyInstance) {
  fastify.get("/api-key", async (req) => {
    const apiKey = await container.apiKeyRepo.getForUser(req.userId);

    return {
      hasKey: apiKey !== null,
      keyPreview: apiKey?.keyPreview ?? null,
      createdAt: apiKey?.createdAt ?? null,
      updatedAt: apiKey?.updatedAt ?? null,
    };
  });

  fastify.post("/api-key", async (req, reply) => {
    const apiKey = generateApiKey();
    const saved = await container.apiKeyRepo.rotateForUser(
      req.userId,
      hashApiKey(apiKey),
      previewApiKey(apiKey),
    );

    return reply.send({
      apiKey,
      keyPreview: saved.keyPreview,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    });
  });
}
