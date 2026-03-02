import type { FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import Fastify from "fastify";
import { createClient } from "@supabase/supabase-js";
import { hashApiKey } from "../../auth/apiKeys.js";
import * as container from "../container.js";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
}

const supabaseUrl = process.env["SUPABASE_URL"]!;
const supabaseKey = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;

async function authPlugin(fastify: ReturnType<typeof Fastify>) {
  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

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
    const { data, error } = await client.auth.getUser(token);
    if (!error && data.user) {
      request.userId = data.user.id;
      return;
    }

    const userId = await container.apiKeyRepo.findUserIdByTokenHash(hashApiKey(token));
    if (!userId) {
      return reply.status(401).send({ error: "Invalid token" });
    }

    request.userId = userId;
  });
}

export default fp(authPlugin, { name: "auth" });
