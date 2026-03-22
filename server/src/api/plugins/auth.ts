import type { FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import Fastify from "fastify";
import { resolveUserIdFromToken } from "../../auth/tokenAuth.js";
import * as container from "../container.js";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
}

const jwtSecret =
  process.env["JWT_SECRET"] ??
  (() => {
    throw new Error("Missing JWT_SECRET environment variable");
  })();

async function authPlugin(fastify: ReturnType<typeof Fastify>) {
  fastify.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
    const routeConfig = request.routeOptions.config as unknown as
      | { skipAuth?: boolean }
      | undefined;
    const skipAuth = Boolean(routeConfig?.skipAuth);
    if (skipAuth) return;

    const auth = request.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "Missing or invalid Authorization header" });
    }
    const token = auth.slice(7);
    const userId = await resolveUserIdFromToken(token, jwtSecret, container.apiKeyRepo);
    if (!userId) {
      return reply.status(401).send({ error: "Invalid token" });
    }

    request.userId = userId;
  });
}

export default fp(authPlugin, { name: "auth" });
