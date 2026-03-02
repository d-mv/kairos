import "dotenv/config";
import { buildApp } from "./buildApp.js";

// ── Start ─────────────────────────────────────────────────────────────────
const fastify = await buildApp();
const port = Number(process.env["PORT"] ?? 3000);
await fastify.listen({ port, host: "0.0.0.0" });
console.log(`Kairos server running on port ${port}`);
