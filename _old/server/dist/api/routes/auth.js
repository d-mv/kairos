import * as container from "../container.js";
import { generateApiKey, hashApiKey, previewApiKey } from "../../auth/apiKeys.js";
export async function authRoutes(fastify) {
    fastify.get("/api-keys", async (req) => {
        return container.apiKeyRepo.listForUser(req.userId);
    });
    fastify.post("/api-keys", async (req, reply) => {
        const { name } = req.body;
        if (!name?.trim()) {
            return reply.status(400).send({ error: "name is required" });
        }
        const apiKey = generateApiKey();
        const record = await container.apiKeyRepo.createForUser(req.userId, name.trim(), hashApiKey(apiKey), previewApiKey(apiKey));
        return reply.status(201).send({ ...record, apiKey });
    });
    fastify.delete("/api-keys/:id", async (req, reply) => {
        await container.apiKeyRepo.deleteForUser(req.userId, req.params.id);
        return reply.status(204).send();
    });
}
//# sourceMappingURL=auth.js.map