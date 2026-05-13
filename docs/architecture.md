# Kairos — Architecture

Self-hosted, open-source task management app. Todoist replacement with built-in AI (MCP) access.

---

## System Overview

### System Context

```mermaid
C4Context
    title System Context diagram for Kairos

    Person(user, "User", "A person managing tasks and projects.")
    System(kairos, "Kairos App", "Task management system with LiveView UI and MCP server.")
    System_Ext(supabase, "Supabase", "Hosted PostgreSQL database.")
    System_Ext(fly, "Fly.io", "Deployment platform.")
    System_Ext(resend, "Resend", "Email delivery service.")
    System_Ext(claude, "Claude / AI Clients", "AI assistants interacting via MCP.")

    Rel(user, kairos, "Uses (HTTPS/WebSockets)", "Browser")
    Rel(kairos, supabase, "Reads/Writes", "PostgreSQL/Ecto")
    Rel(kairos, resend, "Sends emails", "SMTP/API")
    Rel(claude, kairos, "Interacts via MCP", "HTTP")
    Rel(fly, kairos, "Hosts", "Docker Container")
```

---

## Stack

| Layer | Choice |
|---|---|
| Language | Elixir 1.18 / OTP 27 |
| Framework | Phoenix 1.7 + LiveView |
| UI | HEEx + LiveView + Tailwind + Salad UI |
| Icons | Heroicons (Phoenix built-in) |
| Gantt | frappe-gantt via Phoenix JS hook |
| Database | Supabase hosted PostgreSQL |
| ORM | Ecto 3 + Postgrex |
| Auth | `phx.gen.auth` (Postgres-backed) |
| Email | Resend via Swoosh |
| Real-time | Phoenix PubSub + LiveView |
| MCP | `hermes-mcp`, HTTP transport |
| Testing | ExUnit + DataCase |
| Deploy | Single Fly.io app (Phoenix release) |

---

## Domain Model

### Entities & Relationships (ERD)

```mermaid
erDiagram
    USER ||--o{ AREA : manages
    USER ||--o{ PROJECT : manages
    USER ||--o{ TASK : manages
    USER ||--o{ MCP_TOKEN : uses
    AREA ||--o{ PROJECT : contains
    AREA ||--o{ TASK : contains
    PROJECT ||--o{ TASK : contains
    TASK ||--o{ TASK : "parent of (subtasks)"
    TASK ||--o{ LINK : "source/target"
    
    TASK {
        uuid id PK
        string title
        text notes
        string status
        datetime due_date
        integer position
    }
    
    LINK {
        uuid id PK
        uuid from_id FK
        uuid to_id FK
        string link_type
    }
```

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

---

## Real-time Architecture

LiveView handles real-time natively via PubSub. When a change occurs in one client, it is broadcasted to all other active sessions for that user.

```mermaid
sequenceDiagram
    participant U1 as User 1 (Browser)
    participant LV1 as LiveView 1
    participant PS as Phoenix PubSub
    participant LV2 as LiveView 2
    participant U2 as User 2 (Browser)

    U1->>LV1: Mark task as complete
    LV1->>Repo: Update task status in DB
    LV1->>PS: Broadcast "task_updated" to "tasks:user_id"
    PS-->>LV2: Notify "task_updated"
    LV2->>U2: Push update via WebSocket (DOM patch)
```

---

## 3rd Party Services & APIs

### Infrastructure
- **Fly.io**: Primary hosting provider. Runs the Phoenix application as a Dockerized release in the `fra` (Frankfurt) region.
- **Supabase**: Managed PostgreSQL hosting. Used for all application data, including authentication and full-text search.

### External APIs
- **Resend**: Used for transactional emails (sign-up verification, password resets). Integrated via `Swoosh.Adapters.Resend`.
- **MCP (Model Context Protocol)**: Exposes a set of tools for AI assistants (like Claude) to interact with the application data.

### Frontend Libraries
- **frappe-gantt**: JavaScript library for rendering the Gantt chart in Phase 2. Integrated via Phoenix JS Hooks.
- **Salad UI**: A collection of accessible UI components built on top of Tailwind CSS and Phoenix LiveView.
- **Heroicons**: Standard icon set provided by Tailwind Labs, integrated via Phoenix core components.

---

## Deployment Details

### Build Process
The application is built using a multi-stage `Dockerfile` that produces a minimal Elixir release image.
1. **Build Stage**: Installs Elixir, Node.js (for assets), compiles the application, and builds assets.
2. **Release Stage**: Copies the compiled release into a clean Debian-slim image.

### Environment Variables
| Variable | Description | Source |
|---|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string | Supabase |
| `SECRET_KEY_BASE` | Phoenix session/cookie secret | Generated |
| `PHX_HOST` | Production hostname (e.g., `kairos-app.fly.dev`) | Fly.io |
| `RESEND_API_KEY` | API key for Resend email service | Resend |
| `PORT` | Port the server listens on (default 8080) | Fly.io |

### Deployment Command
Deployment is handled via the Fly CLI:
```bash
fly deploy
```
This command triggers a remote build, runs migrations (via `release_command` in `fly.toml`), and performs a rolling update of the application instances.

---

## Project Management & Compliance

The project follows a structured 15-step development process, tracked via the **Kairos project management system** (this application itself, via its MCP server).
- **Project ID**: Defined in `kairos.id`
- **Logging**: Integrated with a centralized Logger API for production observability (optional).
- **Standards**: Strict adherence to semantic commits and comprehensive test coverage (90%+ threshold).
