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
- [ ] Set prod secrets: `DATABASE_URL` (Supabase), `SECRET_KEY_BASE`, `PHX_HOST`

## Phase 1 — Auth

- [ ] `mix phx.gen.auth Accounts User users`
- [ ] Run migrations
- [ ] Verify login / register / logout flow in browser
- [ ] Lock all LiveView routes behind auth

## Phase 2 — Database Schema

- [ ] Migration: `areas` table
- [ ] Migration: `projects` table (area_id nullable)
- [ ] Migration: `tasks` table (project_id nullable, area_id nullable, parent_id nullable)
- [ ] Migration: `links` table (from_id, from_type, to_id, to_type, link_type)
- [ ] Add DB constraints: task max depth (parent must have no parent), self-link forbidden
- [ ] Run migrations, verify schema in Supabase dashboard

## Phase 3 — Contexts

- [ ] `Areas` context: `list_areas/1`, `create_area/1`, `update_area/2`, `delete_area/1`
- [ ] `Projects` context: `list_projects/1`, `create_project/1`, `update_project/2`, `delete_project/1`, `demote_to_task/1`
- [ ] `Tasks` context: `list_tasks/1`, `list_inbox/1`, `create_task/1`, `update_task/2`, `complete_task/1`, `reopen_task/1`, `delete_task/1`, `promote_to_project/1`
- [ ] `Links` context: `create_link/1` (auto-inverse), `delete_link/1`, `list_links_for/2`
- [ ] ExUnit tests for all domain rules:
  - [ ] Subtask depth limit
  - [ ] Promotion (subtasks → project tasks)
  - [ ] Demotion blocked when tasks have subtasks
  - [ ] Self-link forbidden
  - [ ] Inverse links auto-created

## Phase 4 — LiveView Pages

- [ ] Router: define all live routes (authenticated)
- [ ] `InboxLive` — list inbox tasks, add task, complete task
- [ ] `TodayLive` — tasks due today across all containers
- [ ] `UpcomingLive` — tasks with future due dates
- [ ] `AreaLive` — area tasks + projects list
- [ ] `ProjectLive` — project tasks
- [ ] `SearchLive` — full-text search across tasks
- [ ] `CompletedLive` — completed tasks
- [ ] Sidebar navigation component (areas + projects tree)
- [ ] Task detail panel (slide-in, edit title/notes/due date)
- [ ] PubSub broadcast on all mutations — all open LiveViews update live

## Phase 5 — UI Polish

- [ ] Salad UI components wired: Button, Input, Modal, Dropdown, Badge
- [ ] Task item component — checkbox, title, due date, project badge
- [ ] New task inline input (bottom of list)
- [ ] Keyboard shortcuts: `n` new task, `e` edit, `/` search
- [ ] Dark mode via Tailwind `dark:` classes
- [ ] Mobile responsive layout

## Phase 6 — MCP Server

- [ ] Configure `hermes_mcp` in `mix.exs`
- [ ] Mount `/mcp` scope in router with bearer token auth
- [ ] Implement all 10 tools (call contexts directly)
- [ ] Test via Claude Desktop / `kairos.id` file

## Phase 7 — Deploy

- [ ] `mix release` — verify clean build
- [ ] `fly deploy` — single app
- [ ] Set `DATABASE_URL`, `SECRET_KEY_BASE`, `PHX_HOST` secrets
- [ ] Smoke test production

## Phase 8 — Gantt (Phase 2)

- [ ] Add frappe-gantt to `assets/package.json`
- [ ] `GanttHook` in `assets/js/hooks/gantt_hook.js`
- [ ] `GanttLive` — assigns tasks + links as JSON
- [ ] Hook mounts frappe-gantt on `mounted()`, updates on `updated()`
- [ ] Drag interaction pushes `link_create` / `date_update` events to LiveView
- [ ] LiveView handles events, updates DB, broadcasts
