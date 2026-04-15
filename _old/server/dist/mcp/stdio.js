import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import "dotenv/config";
import { createKairosMcpServer } from "./kairosMcpServer.js";
import { resolveKairosMcpUserId } from "./stdioAuth.js";
const userId = await resolveKairosMcpUserId();
const server = createKairosMcpServer({ getUserId: () => userId });
const transport = new StdioServerTransport();
await server.connect(transport);
//# sourceMappingURL=stdio.js.map