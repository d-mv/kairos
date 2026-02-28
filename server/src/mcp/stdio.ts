import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import "dotenv/config";
import { createKairosMcpServer } from "./kairosMcpServer.js";

const server = createKairosMcpServer();
const transport = new StdioServerTransport();

await server.connect(transport);
