import type { FastifyInstance } from "fastify";
import { createKairosMcpServer } from "./kairosMcpServer.js";

export async function mcpPlugin(fastify: FastifyInstance) {
  const server = createKairosMcpServer();

  fastify.log.info("MCP plugin registered");
}
