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
- **Runtime:** Node.js
- **Framework:** Fastify + TypeScript
- **Database:** Supabase (PostgreSQL + Auth)
- **Real-time:** `@fastify/websocket` (WebSocket server built into Fastify)
- **MCP:** Built-in as a Fastify plugin (same process, not a separate service)
- **Deploy:** Fly.io

### Frontend
- **Framework:** React + TypeScript
- **State:** Jotai
- **UI Kit:** shadcn/ui + Tailwind CSS
- **Real-time:** WebSocket connection to Fastify
- **Auth:** Supabase Auth client
- **Deploy:** Netlify

### Testing & Design
- **Test runner:** Vitest
- **Methodology:** TDD (Test-Driven Development)
- **Architecture:** Domain-Driven Design (DDD)

---

## Project Structure

```
/
├── server/
│   ├── domain/
│   │   ├── shared/           # Entity, ValueObject, DomainEvent, Result
│   │   ├── task/             # Task aggregate, repository interface, domain events
│   │   ├── project/          # Project aggregate, repository interface
│   │   ├── area/             # Area aggregate, repository interface
│   │   └── link/             # Link domain model
│   ├── application/          # Use cases / application services
│   ├── infrastructure/
│   │   ├── supabase/         # Repository implementations
│   │   └── websocket/        # Event broadcasting
│   ├── api/                  # Fastify routes (thin layer over application)
│   └── mcp/                  # MCP tools (calls application layer)
├── client/
│   ├── components/
│   ├── atoms/                # Jotai atoms
│   └── pages/
└── shared/                   # Shared TypeScript types
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

| Link Type    | Inverse       | Bidirectional? |
|--------------|---------------|----------------|
| `blocks`     | `blocked_by`  | Yes — auto-creates inverse |
| `blocked_by` | `blocks`      | Yes — auto-creates inverse |
| `related_to` | `related_to`  | Yes — symmetric, auto-creates inverse |

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
