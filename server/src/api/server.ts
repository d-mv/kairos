import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import fp from 'fastify-plugin';

import authPlugin from './plugins/auth.js';
import { areaRoutes } from './routes/areas.js';
import { projectRoutes } from './routes/projects.js';
import { taskRoutes } from './routes/tasks.js';
import { linkRoutes } from './routes/links.js';
import { eventBus } from './container.js';

const fastify = Fastify({ logger: true });

// ── Plugins ──────────────────────────────────────────────────────────────
await fastify.register(cors, {
  origin: process.env['CLIENT_URL'] ?? 'http://localhost:5173',
  credentials: true,
});

await fastify.register(websocket);

// ── WebSocket endpoint ────────────────────────────────────────────────────
fastify.get('/ws', { websocket: true, config: { skipAuth: true } }, (socket) => {
  eventBus.addClient(socket as unknown as { readyState: number; send(data: string): void });

  socket.on('close', () => {
    eventBus.removeClient(socket as unknown as { readyState: number; send(data: string): void });
  });
});

// ── Auth plugin ───────────────────────────────────────────────────────────
await fastify.register(authPlugin);

// ── API Routes ────────────────────────────────────────────────────────────
await fastify.register(areaRoutes, { prefix: '/api/v1/areas' });
await fastify.register(projectRoutes, { prefix: '/api/v1/projects' });
await fastify.register(taskRoutes, { prefix: '/api/v1/tasks' });
await fastify.register(linkRoutes, { prefix: '/api/v1/links' });

// ── Health check ──────────────────────────────────────────────────────────
fastify.get('/health', { config: { skipAuth: true } }, async () => ({ status: 'ok' }));

// ── MCP plugin ────────────────────────────────────────────────────────────
const { mcpPlugin } = await import('../mcp/mcp.plugin.js');
await fastify.register(fp(mcpPlugin));

// ── Start ─────────────────────────────────────────────────────────────────
const port = Number(process.env['PORT'] ?? 3000);
await fastify.listen({ port, host: '0.0.0.0' });
console.log(`Kairos server running on port ${port}`);
