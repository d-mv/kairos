# Kairos — Architecture

Self-hosted, open-source task management app. Todoist replacement with built-in AI (MCP) access.

---

## Stack

| Layer | Choice |
|---|---|
| Language | Elixir 1.18 / OTP 27 |
| Framework | Phoenix 1.7 + LiveView |
| UI | HEEx + LiveView + Tailwind + Salad UI |
| Icons | Heroicons (Phoenix built-in) |
| Gantt (Phase 2) | frappe-gantt via Phoenix JS hook |
| Database | Supabase hosted PostgreSQL |
| ORM | Ecto 3 + Postgrex |
| Auth | `phx.gen.auth` (Postgres-backed) |
| Real-time | Phoenix PubSub + LiveView (no separate WS layer) |
| MCP | `hermes-mcp`, HTTP transport, mounted in Phoenix router |
| Testing | ExUnit + DataCase |
| Deploy | Single Fly.io app (Phoenix release) |

---

## Project Structure

```
kairos/                          # Phoenix umbrella (or standard app)
├── lib/
│   ├── kairos/                  # Business logic (contexts)
│   │   ├── accounts/            # Users — phx.gen.auth
│   │   ├── tasks/               # Task context
│   │   │   ├── task.ex          # Ecto schema
│   │   │   └── tasks.ex         # Context module (public API)
│   │   ├── projects/
│   │   │   ├── project.ex
│   │   │   └── projects.ex
│   │   ├── areas/
│   │   │   ├── area.ex
│   │   │   └── areas.ex
│   │   └── links/
│   │       ├── link.ex
│   │       └── links.ex
│   └── kairos_web/              # Phoenix web layer
│       ├── components/          # Salad UI + core_components.ex
│       ├── controllers/         # REST (MCP callbacks if needed)
│       ├── live/                # LiveView modules
│       │   ├── inbox_live.ex
│       │   ├── today_live.ex
│       │   ├── upcoming_live.ex
│       │   ├── area_live.ex
│       │   ├── project_live.ex
│       │   ├── search_live.ex
│       │   └── gantt_live.ex    # Phase 2
│       └── router.ex
├── priv/
│   └── repo/migrations/         # Ecto migrations (source of truth)
├── assets/
│   ├── js/
│   │   ├── app.js
│   │   └── hooks/
│   │       └── gantt_hook.js    # Phase 2 — frappe-gantt
│   └── css/
│       └── app.css              # Tailwind
├── test/
│   ├── kairos/                  # Context unit tests
│   └── kairos_web/              # LiveView + controller tests
├── fly.toml
├── Dockerfile
└── _old/                        # Old Node.js/React app (reference only)
```

---

## Domain Model

### Entities

- **Area** — top-level container (Work, Home, Personal)
- **Project** — belongs to Area or unassigned; never Inbox
- **Task** — belongs to Inbox, Area, or Project (exclusive)
- **Subtask** — child of Task; max depth 1 (hard rule)
- **Link** — dependency between any two entities

### Domain Rules

| Rule | Enforcement |
|---|---|
| Task belongs to exactly one of: Inbox, Area, Project | DB constraint + context guard |
| Subtasks cannot have children | Context guard, returns `{:error, :max_depth}` |
| Task→Project promotion: subtasks become project tasks | `Tasks.promote_to_project/1` |
| Project→Task demotion: blocked if any task has subtasks | `Projects.demote_to_task/1` returns `{:error, :has_subtasks}` |
| Self-links forbidden | Context guard |
| `blocks`/`blocked_by` auto-creates inverse | `Links.create_link/1` |
| `related_to` is symmetric | `Links.create_link/1` |

### Link Types

| Type | Inverse | Symmetric |
|---|---|---|
| `blocks` | `blocked_by` | Yes |
| `blocked_by` | `blocks` | Yes |
| `related_to` | `related_to` | Yes |

---

## Context Design (Fat Contexts)

Each context owns its Ecto schema + all business logic. No repository interfaces. No domain event objects. Errors via `{:ok, result}` / `{:error, reason}`.

```elixir
# Example — Tasks context
defmodule Kairos.Tasks do
  alias Kairos.Tasks.Task
  alias Kairos.Repo

  def list_inbox_tasks(user_id), do: ...
  def create_task(attrs), do: ...
  def update_task(%Task{} = task, attrs), do: ...
  def complete_task(%Task{} = task), do: ...
  def promote_to_project(%Task{} = task), do: ...
  def delete_task(%Task{} = task), do: ...
end
```

---

## Auth

`phx.gen.auth` generates:
- `Kairos.Accounts` context
- `users`, `users_tokens` tables
- Session + token-based auth
- Login / register / password reset LiveViews

No Supabase Auth — Supabase is DB host only.

---

## Real-time

LiveView handles real-time natively via PubSub:

```elixir
# On task update:
Phoenix.PubSub.broadcast(Kairos.PubSub, "tasks:#{user_id}", {:task_updated, task})

# In LiveView:
def handle_info({:task_updated, task}, socket), do: ...
```

No custom WebSocket layer needed.

---

## MCP Server

`hermes-mcp` mounted in Phoenix router at `/mcp`. HTTP transport. Auth via bearer token.

### Tools

| Tool | Context call |
|---|---|
| `list_tasks` | `Tasks.list_tasks/1` |
| `create_task` | `Tasks.create_task/1` |
| `update_task` | `Tasks.update_task/2` |
| `delete_task` | `Tasks.delete_task/1` |
| `complete_task` | `Tasks.complete_task/1` |
| `list_projects` | `Projects.list_projects/1` |
| `create_project` | `Projects.create_project/1` |
| `create_link` | `Links.create_link/1` |
| `promote_task` | `Tasks.promote_to_project/1` |
| `demote_project` | `Projects.demote_to_task/1` |

---

## Database Schema

All tables owned by Ecto migrations. Supabase = hosted Postgres only.

### Tables

```
users                    # phx.gen.auth
users_tokens             # phx.gen.auth
areas                    # id, user_id, name, inserted_at, updated_at
projects                 # id, user_id, area_id (nullable), name, status, inserted_at, updated_at
tasks                    # id, user_id, project_id (nullable), area_id (nullable), parent_id (nullable), title, notes, status, due_date, position, inserted_at, updated_at
links                    # id, from_id, from_type, to_id, to_type, link_type, inserted_at
```

---

## Deployment

Single Phoenix release on Fly.io.

- Region: Frankfurt (fra)
- Runtime: Elixir release (not Docker Node)
- DB: Supabase connection string via env var `DATABASE_URL`
- Config: `fly.toml`
- Deploy: `fly deploy`

---

## Gantt (Phase 2)

frappe-gantt mounted as a Phoenix JS hook on `gantt_live.ex`.

- LiveView assigns push task + link data as JSON
- Hook initialises frappe-gantt on `mounted()`
- Drag interactions push events back to LiveView
- LiveView updates DB, broadcasts via PubSub
