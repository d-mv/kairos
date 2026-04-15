import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import Fastify from "fastify";
import type { FastifyError } from "fastify";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { apiKeyRepo, eventBus } from "./container.js";
import authPlugin from "./plugins/auth.js";
import { authRoutes } from "./routes/auth.js";
import { areaRoutes } from "./routes/areas.js";
import { brainRoutes } from "./routes/brain.js";
import { collaborationRoutes } from "./routes/collaboration.js";
import { integrationRoutes } from "./routes/integrations.js";
import { linkRoutes } from "./routes/links.js";
import { createKairosMcpServer } from "../mcp/kairosMcpServer.js";
import { notificationRoutes } from "./routes/notifications.js";
import { projectRoutes } from "./routes/projects.js";
import { taskRoutes } from "./routes/tasks.js";
import { resolveUserIdFromToken } from "../auth/tokenAuth.js";
import { captureServerException } from "../observability/sentry.js";

export async function buildApp() {
  const fastify = Fastify({ logger: true });
  const jwtSecret = process.env["JWT_SECRET"];
  if (!jwtSecret) {
    throw new Error("Missing JWT_SECRET environment variable");
  }

  await fastify.register(cors, {
    origin: process.env["CLIENT_URL"] ?? "http://localhost:5173",
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  await fastify.register(websocket);

  fastify.get("/ws", { websocket: true, config: { skipAuth: true } }, async (socket, req) => {
    let authenticated = false;
    const closeTimer = setTimeout(() => {
      if (!authenticated) socket.close();
    }, 5000);

    socket.on("message", async (rawMessage) => {
      if (authenticated) return;

      let token: string | null = null;
      try {
        const message = JSON.parse(String(rawMessage)) as { type?: string; token?: string };
        token = message.type === "auth" && typeof message.token === "string" ? message.token : null;
      } catch {
        token = null;
      }

      if (!token) {
        socket.close();
        return;
      }

      const userId = await resolveUserIdFromToken(
        token,
        jwtSecret,
        process.env["SUPABASE_URL"] ?? "",
        apiKeyRepo,
      );
      if (!userId) {
        socket.close();
        return;
      }

      authenticated = true;
      clearTimeout(closeTimer);
      eventBus.addClient(
        userId,
        socket as unknown as { readyState: number; send(data: string): void },
      );
    });

    socket.on("close", () => {
      clearTimeout(closeTimer);
      eventBus.removeClient(socket as unknown as { readyState: number; send(data: string): void });
    });
  });

  fastify.get(
    "/.well-known/oauth-protected-resource/mcp",
    { config: { skipAuth: true } },
    async (_request, reply) => reply.code(404).send({ error: "Not Found" }),
  );

  fastify.get(
    "/.well-known/oauth-authorization-server",
    { config: { skipAuth: true } },
    async (_request, reply) => reply.code(404).send({ error: "Not Found" }),
  );

  fastify.get(
    "/mcp/.well-known/oauth-authorization-server",
    { config: { skipAuth: true } },
    async (_request, reply) => reply.code(404).send({ error: "Not Found" }),
  );

  await fastify.register(authPlugin);

  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    if ((error.statusCode ?? 500) >= 500) {
      captureServerException(error, {
        method: request.method,
        requestId: request.id,
        url: request.url,
        userId: request.userId,
      });
    }

    return reply.send(error instanceof Error ? error : new Error(String(error)));
  });

  fastify.post("/mcp", async (request, reply) => {
    const server = createKairosMcpServer({ getUserId: () => request.userId });
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    await server.connect(transport);

    reply.hijack();
    await transport.handleRequest(request.raw, reply.raw, request.body);
  });

  fastify.get("/mcp", { config: { skipAuth: true } }, async (_request, reply) => {
    return reply.code(405).header("Allow", "POST").send("Method Not Allowed");
  });

  fastify.delete("/mcp", { config: { skipAuth: true } }, async (_request, reply) => {
    return reply.code(405).header("Allow", "POST").send("Method Not Allowed");
  });

  await fastify.register(areaRoutes, { prefix: "/api/v1/areas" });
  await fastify.register(authRoutes, { prefix: "/api/v1/auth" });
  await fastify.register(brainRoutes, { prefix: "/api/v1/brain" });
  await fastify.register(collaborationRoutes, { prefix: "/api/v1/collaboration" });
  await fastify.register(integrationRoutes, { prefix: "/api/v1/integrations" });
  await fastify.register(notificationRoutes, { prefix: "/api/v1/notifications" });
  await fastify.register(projectRoutes, { prefix: "/api/v1/projects" });
  await fastify.register(taskRoutes, { prefix: "/api/v1/tasks" });
  await fastify.register(linkRoutes, { prefix: "/api/v1/links" });

  fastify.get("/health", { config: { skipAuth: true } }, async () => ({ status: "ok" }));

  return fastify;
}
