# CLAUDE.md — Todoist Replacement App

This file contains the full project specification, architecture decisions, and domain rules agreed upon during planning. Read this before starting any task.

---

## Project Overview

A self-hosted, open-source task management application to replace Todoist. Key differentiators:

- No subscription fees
- Built-in MCP server (AI-accessible via Claude)
- Gantt chart with dependency tracking
- Rich domain model going beyond standard to-do features

---

## Tech Stack

### Backend

- **Runtime:** Node.js 22 (Alpine)
- **Framework:** Fastify ^5.7.4 + TypeScript ^5.8.3
- **Database:** Supabase (PostgreSQL + Auth)
- **Real-time:** `@fastify/websocket` ^11.2.0 (WebSocket server built into Fastify)
- **Auth:** `@fastify/jwt` ^10.0.0 + `jose` ^6.1.0 (Supabase JWT verification via JWKS)
- **Validation:** Zod ^3.24.4
- **MCP:** `@modelcontextprotocol/sdk` ^1.27.1, built-in as a Fastify plugin (stdio transport)
- **Observability:** `@sentry/node` ^10.22.0
- **Deploy:** Fly.io (`kairos-app`, Frankfurt region, 512 MB)

### Frontend

- **Framework:** React ^19.2.4 + TypeScript 5.9
- **Build:** Vite ^7.3.1 (PWA via `vite-plugin-pwa`)
- **Router:** react-router-dom ^7.6.2
- **State:** Jotai ^2.18.0
- **UI Kit:** Mantine ^9.0.0-alpha.4 (CSS vars, no Tailwind, no shadcn/ui)
- **Icons:** react-icons ^5.6.0
- **Dates:** date-fns ^4.1.0
- **Real-time:** WebSocket connection to Fastify
- **Auth:** `@supabase/supabase-js` + `@supabase/auth-ui-react`
- **Observability:** `@sentry/react` ^10.45.0
- **Deploy:** Fly.io (`kairos-web`, Frankfurt region, 256 MB, served by nginx)

### Testing, Linting & Tooling

- **Test runner (server):** Vitest ^4.0.18
- **Test runner (client):** Node.js built-in test runner via tsx
- **E2E tests:** Playwright ^1.58.2 (`pnpm test:ui`)
- **Linter:** oxlint ^1.50.0
- **Formatter:** oxfmt ^0.35.0
- **Git hooks:** Lefthook ^2.1.1 (pre-commit: lint + format:check + typecheck + test; pre-push: build)
- **Package manager:** pnpm ^10 workspace (packages: `shared`, `server`, `client`)
- **Methodology:** TDD + Domain-Driven Design (DDD)

---

## Project Structure

```
/
├── server/src/
│   ├── domain/
│   │   ├── shared/           # Entity, ValueObject, DomainEvent, Result
│   │   ├── task/             # Task aggregate, repository interface, domain events
│   │   ├── project/          # Project aggregate, repository interface
│   │   ├── area/             # Area aggregate, repository interface
│   │   └── link/             # Link domain model
│   ├── application/          # Use cases (area, brain, collaboration, integration, link, project, task)
│   ├── infrastructure/       # Supabase repos, websocket broadcaster, security
│   ├── api/                  # Fastify routes + container.ts (DI wiring)
│   ├── auth/                 # JWT/JWKS auth plugin
│   ├── mcp/                  # MCP plugin (stdio transport, calls application layer)
│   └── observability/        # Sentry setup
├── client/src/
│   ├── atoms/                # Jotai atoms
│   ├── components/           # React components
│   ├── hooks/                # Custom hooks (useDataSync, etc.)
│   ├── pages/                # Route-level components
│   └── lib/                  # Utilities
├── shared/src/               # @kairos/shared — DTOs shared between client and server
├── scripts/                  # DB init/migrate scripts, UI regression runner
├── Dockerfile                # Server image (Node 22 Alpine → node dist/api/server.js)
├── Dockerfile.client         # Client image (Node 22 Alpine build → nginx-unprivileged)
├── fly.toml                  # Server Fly.io config (app: kairos-app)
├── fly.client.toml           # Client Fly.io config (app: kairos-web)
└── nginx.client.conf         # nginx config for static client serving
```

---

## Domain Model

### Entities

#### Area

- Top-level organizational container (e.g. Home, Work, Personal)
- Projects and Tasks can belong to an Area
- A project can be unassigned (no area) but cannot be in the Inbox

#### Project

- Belongs to an **Area**, or is **unassigned** (no area)
- Projects do **not** go to Inbox — only Tasks do
- Contains first-level Tasks only (no nested projects)
- Can be demoted to a Task (see rules below)

#### Task

- Belongs to one of: **Inbox**, **Area**, or **Project** — never more than one
- Can have **Subtasks** (one level deep only)
- Can be promoted to a Project (see rules below)

#### Subtask

- A child of a Task
- **Hard domain rule: Subtasks cannot have children** — enforced at domain level, not just UI
- Attempting to add a child to a subtask throws a domain error

#### Inbox

- Holds Tasks that have not been assigned to an Area or Project
- Only Tasks can be in the Inbox (not Projects)

---

## Domain Rules

### Ownership (Exclusive)

- A Task belongs to exactly one of: Inbox, Area, or Project
- A Project belongs to an Area, or is unassigned — never Inbox
- These are mutually exclusive — no entity can belong to multiple containers

### Subtask Depth

- Tasks can have Subtasks (depth = 1)
- Subtasks cannot have children (depth limit = 1, hard rule)
- This is enforced at the domain layer

### Task → Project Promotion

- A Task is promoted to a Project
- Its Subtasks become first-level Tasks of the new Project
- The promoted Task inherits its Area (if any)

### Project → Task Demotion

- A Project can only be demoted to a Task if **none of its Tasks have Subtasks**
- If any Task within the Project has Subtasks, demotion is **blocked** at the domain level (throws a domain error)
- If demotion is allowed, the Project's Tasks become Subtasks of the new Task

### Links (Dependencies)

Links connect Tasks, Subtasks, and Projects to each other for Gantt dependency tracking.

| Link Type    | Inverse      | Bidirectional?                        |
| ------------ | ------------ | ------------------------------------- |
| `blocks`     | `blocked_by` | Yes — auto-creates inverse            |
| `blocked_by` | `blocks`     | Yes — auto-creates inverse            |
| `related_to` | `related_to` | Yes — symmetric, auto-creates inverse |

**Link rules:**

- Creating a `blocks` link auto-creates the corresponding `blocked_by` link and vice versa
- `related_to` is symmetric — creating it in one direction auto-creates it in the other
- **Self-links are forbidden** at the domain level (a task/project cannot link to itself)
- Links can connect any combination of: Task ↔ Task, Task ↔ Subtask, Task ↔ Project, Project ↔ Project, Subtask ↔ Subtask

---

## Data Flow

```
UI  ←→  REST API       (CRUD operations)
UI  ←→  WebSocket      (real-time sync — updates pushed from server)
MCP ←→  Application Layer → DB changes → WebSocket broadcast → UI updates live
```

---

## MCP Server

- Built into the Fastify app as a plugin (same process, same deployment)
- Exposes tools for AI interaction, including at minimum:
  - `create_task`
  - `list_tasks`
  - `update_task`
  - `delete_task`
  - `complete_task`
  - `create_project`
  - `list_projects`
  - `create_link`
  - `promote_task` (Task → Project)
  - `demote_project` (Project → Task)
- All MCP tools call through the **application layer** (use cases), never directly to DB
- MCP-triggered changes broadcast via WebSocket so UI stays in sync

---

## Phases

### Phase 1 — Foundation

- [ ] Supabase schema (areas, projects, tasks, subtasks, links)
- [ ] Shared domain primitives (Entity, ValueObject, DomainEvent, Result)
- [ ] Task aggregate + tests
- [ ] Project aggregate + tests
- [ ] Area aggregate + tests
- [ ] Link domain model + tests
- [ ] Promotion/Demotion use cases + tests
- [ ] Fastify REST API (thin routes over application layer)
- [ ] `@fastify/websocket` real-time broadcasting
- [ ] MCP plugin with core tools
- [ ] React UI — task list, project sidebar, task detail panel
- [ ] Jotai atoms wired to REST + WebSocket
- [ ] Supabase Auth integration (frontend + backend)

### Phase 2 — Enhanced UI + Additional Features

- [ ] Gantt chart with dependency visualization (using Links)
- [ ] Drag and drop
- [ ] Keyboard shortcuts
- [ ] Advanced filtering and search
- [ ] Tags
- [ ] Comments
- [ ] Recurring tasks
- [ ] Time tracking
- [ ] (TBD based on evolving vision)

---

## Development Principles

- **TDD:** Write tests before implementation. Domain layer tests are pure (no DB). Integration tests cover repositories. API/MCP tests cover the outer layers.
- **DDD:** Domain layer has zero infrastructure dependencies. Application layer orchestrates use cases. Infrastructure implements repository interfaces. API and MCP are thin adapters.
- **Domain errors over exceptions:** Use a `Result` type for expected failures (e.g. demotion blocked). Reserve exceptions for truly unexpected errors.
