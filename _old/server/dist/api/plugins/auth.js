import fp from "fastify-plugin";
import { resolveUserIdFromToken } from "../../auth/tokenAuth.js";
import * as container from "../container.js";
const jwtSecret = process.env["JWT_SECRET"] ??
    (() => {
        throw new Error("Missing JWT_SECRET environment variable");
    })();
const supabaseUrl = process.env["SUPABASE_URL"] ??
    (() => {
        throw new Error("Missing SUPABASE_URL environment variable");
    })();
async function authPlugin(fastify) {
    fastify.addHook("preHandler", async (request, reply) => {
        const routeConfig = request.routeOptions.config;
        const skipAuth = Boolean(routeConfig?.skipAuth);
        if (skipAuth)
            return;
        const auth = request.headers.authorization;
        if (!auth?.startsWith("Bearer ")) {
            return reply.status(401).send({ error: "Missing or invalid Authorization header" });
        }
        const token = auth.slice(7);
        const userId = await resolveUserIdFromToken(token, jwtSecret, supabaseUrl, container.apiKeyRepo);
        if (!userId) {
            return reply.status(401).send({ error: "Invalid token" });
        }
        request.userId = userId;
    });
}
export default fp(authPlugin, { name: "auth" });
//# sourceMappingURL=auth.js.map