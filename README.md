# Kairos

Self-hosted task management app with a React frontend, Fastify backend, and built-in MCP server.

## Live Apps

- Frontend: `https://kairos-web.fly.dev/`
- Backend: `https://kairos-app.fly.dev/`
- Health check: `https://kairos-app.fly.dev/health`
- MCP endpoint: `https://kairos-app.fly.dev/mcp`

## Local Development

Prerequisites:

- Node.js 22+
- `pnpm`

Setup:

```bash
pnpm install
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Run:

```bash
pnpm dev:server
pnpm dev:client
```

## Deploy

Backend:

```bash
flyctl deploy -c fly.toml -a kairos-app
```

Frontend:

```bash
flyctl deploy -c fly.client.toml -a kairos-web \
  --build-arg VITE_SUPABASE_URL=https://mirzbygkulqrsknjhsfy.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=<your-anon-key> \
  --build-arg VITE_API_URL=https://kairos-app.fly.dev \
  --build-arg VITE_WS_URL=wss://kairos-app.fly.dev/ws
```

After the frontend URL changes, update backend CORS:

```bash
flyctl secrets set CLIENT_URL=https://kairos-web.fly.dev -a kairos-app
```

## Codex MCP

The remote MCP server uses the authenticated user from the request's Bearer token. Tool calls do not accept a `userId` parameter.

To use the deployed MCP server instead of local stdio, point the Kairos MCP entry in `~/.codex/config.toml` at the remote endpoint:

```toml
[mcp_servers.kairos]
url = "https://kairos-app.fly.dev/mcp"
```

Restart Codex after changing the config.

Codex does not currently have Kairos-specific auth configured in this repo's remote MCP block, so the practical local setup is to use stdio with a per-user auth file.

Create the auth file once:

```bash
cd server
pnpm mcp:login
```

That stores a refresh token in `~/.codex/kairos-auth.json`. Then point Codex at the local stdio server:

```toml
[mcp_servers.kairos]
command = "pnpm"
args = ["mcp:dev"]
cwd = "/Users/dmelnikov/code/kairos/server"
```
