import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as container from "../container.js";

const todoistTokenSchema = z.object({
  token: z.string().trim().min(1, "Todoist token is required"),
});

const disconnectProviderSchema = z.enum(["google", "todoist"]);

export async function integrationRoutes(fastify: FastifyInstance) {
  fastify.get("/", async (req) => {
    return container.listIntegrationStatuses.execute(req.userId);
  });

  fastify.post("/google/start", async (req) => {
    const url = await container.getGoogleAuthUrl.execute(req.userId);
    return { url };
  });

  fastify.get("/google/callback", { config: { skipAuth: true } }, async (req, reply) => {
    const query = req.query as { code?: string; state?: string };
    if (!query.code || !query.state) {
      return reply.redirect(
        container.googleOAuth.getClientRedirectUrl(
          "error",
          "google",
          "Missing Google OAuth parameters",
        ),
      );
    }

    const redirectUrl = await container.connectGoogleIntegration.execute(query.code, query.state);
    return reply.redirect(redirectUrl);
  });

  fastify.put("/todoist/token", async (req, reply) => {
    const parsed = todoistTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: parsed.error.issues[0]?.message ?? "Invalid Todoist token" });
    }

    await container.saveTodoistToken.execute(req.userId, parsed.data.token);
    return reply.status(204).send();
  });

  fastify.delete("/:provider", async (req, reply) => {
    const params = disconnectProviderSchema.safeParse(
      (req.params as { provider?: string }).provider,
    );
    if (!params.success) {
      return reply.status(400).send({ error: "Unsupported integration provider" });
    }

    await container.disconnectIntegration.execute(req.userId, params.data);
    return reply.status(204).send();
  });
}
