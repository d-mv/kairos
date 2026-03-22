import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "./buildApp.js";
import { initSentry } from "../observability/sentry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
initSentry();

// ── Start ─────────────────────────────────────────────────────────────────
const fastify = await buildApp();
const port = Number(process.env["PORT"] ?? 3000);
await fastify.listen({ port, host: "0.0.0.0" });
console.log(`Kairos server running on port ${port}`);
