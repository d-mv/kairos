# Kairos — Build Plan

Reference implementation: `_old/` (Node.js/React app)

---

## Phase 0 — Scaffold

- [x] `mix phx.new kairos --live` in repo root (Phoenix 1.8.5)
- [x] Add `docker-compose.yml` — Postgres 16 on port 5432
- [x] Configure `config/dev.exs` to point at local Postgres
- [x] `mix ecto.create` — DB created, connection verified
- [x] Add Salad UI — 13 components installed into `lib/kairos_web/components/`
- [x] Confirm Heroicons available via `<.icon name="hero-*" />` (built into Phoenix 1.8)
- [x] Add `hermes_mcp` to `mix.exs`
- [x] Fly.io — `fly.toml` written for `kairos-app` (fra, 512mb)
- [x] Set prod secrets: `DATABASE_URL` (Supabase), `SECRET_KEY_BASE`, `PHX_HOST`

## Phase 1 — Auth

- [x] `mix phx.gen.auth Accounts User users`
- [x] Run migrations
- [x] Verify login / register / logout flow in browser
- [x] Lock all LiveView routes behind auth

## Phase 2 — Database Schema

- [x] Migration: `areas` table
- [x] Migration: `projects` table (area_id nullable)
- [x] Migration: `tasks` table (project_id nullable, area_id nullable, parent_id nullable)
- [x] Migration: `links` table (from_id, from_type, to_id, to_type, link_type)
- [x] Add DB constraints: task max depth (context-level, max depth 1), self-link forbidden
- [x] Run migrations, verify schema in Supabase dashboard

## Phase 3 — Contexts

- [x] `Areas` context: `list_areas/1`, `create_area/1`, `update_area/2`, `delete_area/1`
- [x] `Projects` context: `list_projects/1`, `create_project/1`, `update_project/2`, `delete_project/1`, `demote_to_task/1`
- [x] `Tasks` context: `list_tasks/1`, `list_inbox/1`, `create_task/1`, `update_task/2`, `complete_task/1`, `reopen_task/1`, `delete_task/1`, `promote_to_project/1`
- [x] `Links` context: `create_link/1` (auto-inverse), `delete_link/1`, `list_links_for/2`
- [x] ExUnit tests for all domain rules:
  - [x] Subtask depth limit
  - [x] Promotion (subtasks → project tasks)
  - [x] Demotion blocked when tasks have subtasks
  - [x] Self-link forbidden
  - [x] Inverse links auto-created

## Phase 4 — LiveView Pages

- [x] Router: define all live routes (authenticated)
- [x] `InboxLive` — list inbox tasks, add task, complete task
- [x] `TodayLive` — tasks due today across all containers
- [x] `UpcomingLive` — tasks with future due dates
- [x] `AreaLive` — area tasks + projects list
- [x] `ProjectLive` — project tasks
- [x] `SearchLive` — full-text search across tasks
- [x] `CompletedLive` — completed tasks
- [x] Sidebar navigation component (areas + projects tree)
- [x] Task detail panel (slide-in, edit title/notes/due date)
- [x] PubSub broadcast on all mutations — all open LiveViews update live

## Phase 5 — UI Polish

- [x] Keyboard shortcuts: `n` new task, `/` search (JS-based, data-shortcut attrs)
- [x] Mobile responsive layout (sidebar hidden on small screens, mobile header)
- [x] Dark mode via DaisyUI themes + theme_toggle component
- [x] Salad UI components wired: Button, Input, Modal, Dropdown, Badge (using core_components instead)
- [x] Task item reusable component
- [x] Keyboard shortcut `e` to edit selected task

## Phase 6 — MCP Server

- [x] `hermes_mcp` in `mix.exs`
- [x] Mount `/mcp` in router with bearer token auth (Kairos.MCP.AuthPlug)
- [x] Implement all 10 tools (list/create/update/complete/reopen/delete task, list/create project, promote/demote)
- [ ] Test via Claude Desktop / `kairos.id` file

## Phase 7 — Deploy

- [x] Dockerfile generated via `mix phx.gen.release --docker`
- [x] runtime.exs reads `KAIROS_MCP_TOKEN`, `KAIROS_MCP_USER_ID` from env
- [x] `fly deploy` — deployed to kairos-app.fly.dev
- [x] Set `DATABASE_URL`, `SECRET_KEY_BASE`, `PHX_HOST` secrets
- [x] Migrations ran on production (dropped old Node.js tables)
- [x] Smoke test: / → 302, /users/log-in → 200

## Phase 9 — Security & Quality (from REVIEW.md)

### Security
- [x] **MCP multi-tenancy**: AuthPlug validates per-user tokens via `get_user_by_mcp_token/1`
- [x] **Links IDOR**: `user_id` ownership check in `list_links_for/3` and `create_link/1`
- [x] **Tasks ownership**: `check_max_depth/2` uses `Repo.scope(user_id)` to verify ownership
- [x] **Centralized scoping**: `Repo.scope/2` used in all contexts

### Performance
- [x] **N+1 updates**: `Repo.update_all` used in `demote_to_task/1` and `promote_to_project/1`
- [x] **Full-text search**: tsvector generated column + GIN index; search uses `@@ to_tsquery`

### Features & UX
- [x] **Links UI**: "Dependencies / Related" section in `TaskDetailComponent` with add/remove/search
- [x] **Sidebar refactor**: Extract `area_row` and `project_row` private components; dropdowns fixed

---

## Phase 8 — Gantt + Calendar (Phase 2)

- [x] Add frappe-gantt to `assets/package.json`
- [x] `GanttHook` in `assets/js/hooks/gantt_hook.js`
- [x] `GanttLive` — assigns tasks + links as JSON (global, all tasks)
- [x] Hook mounts frappe-gantt on `mounted()`, updates on `updated()`
- [x] Drag interaction pushes `date_update` events to LiveView
- [x] LiveView handles events, updates DB, broadcasts
- [x] ProjectLive: 3-tab view switcher (Tasks / Calendar / Gantt)
- [x] Calendar tab: monthly grid, prev/next month, tasks by due date
- [x] Gantt tab: frappe-gantt scoped to project tasks + dependency links
