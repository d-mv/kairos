import { createKairosMcpServer } from "./kairosMcpServer.js";
export async function mcpPlugin(fastify) {
    const server = createKairosMcpServer();
    fastify.log.info("MCP plugin registered");
}
//# sourceMappingURL=mcp.plugin.js.map