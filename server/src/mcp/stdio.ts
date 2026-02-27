import "dotenv/config";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createKairosMcpServer } from "./kairosMcpServer.js";

const server = createKairosMcpServer();
const transport = new StdioServerTransport();

await server.connect(transport);
