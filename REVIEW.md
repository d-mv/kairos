# Kairos Project Review — May 2026

## 1. Executive Summary
Kairos is a robust, modern migration of a task management system to Elixir/Phoenix. The architecture leverages the strengths of the BEAM (concurrency, real-time PubSub) and provides a high-quality foundation for a Todoist-alternative. Critical security and feature gaps from the April 2026 review have been resolved. Remaining focus areas are performance, search scalability, and UI completeness.

---

## 2. Architecture & Strengths
- **Tech Stack:** Phoenix 1.8.5 + LiveView 1.1.0 + Salad UI. Single-language full-stack with high developer velocity.
- **Context Design:** Strict "Fat Context" pattern. Business logic is well-isolated from the web layer.
- **Real-time Synchronization:** Phoenix PubSub broadcasts mutations across all open tabs instantly.
- **AI Integration:** MCP server over HTTP at `/mcp` with per-user auth token validation.

---

## 3. Resolved Issues (since April 2026)

- **Multi-tenant MCP (FIXED):** `AuthPlug` now validates per-user bearer tokens and assigns `user_id` to each MCP frame dynamically. No global hardcoded token.
- **Links UI (FIXED):** `TaskDetailComponent` now includes full dependency/link management: add, delete, search, and type selection (`related_to`, `blocks`, `blocked_by`).
- **MCP PubSub (FIXED):** All MCP mutations now broadcast `tasks_changed` via PubSub so open LiveViews refresh instantly.

---

## 4. Remaining Weaknesses

### Security
- **IDOR (Insecure Direct Object Reference):**
  - `Kairos.Links.list_links_for/2`: No `user_id` check. An attacker could iterate IDs to discover dependencies.
  - `Kairos.Links.create_link/1`: Does not verify the requester owns both `from` and `to` entities.
  - `Kairos.Tasks.check_max_depth/1`: Fetches parent tasks without verifying ownership.
- **Authorization Layer:** No centralized authorization. Ownership checks are manual in Ecto queries — error-prone as the application grows.

### Performance & Scalability
- **N+1 Update Operations:** `Tasks.promote_to_project/1` and `Projects.demote_to_task/1` iterate and perform individual `Repo.update!` calls. Should use `Repo.update_all/3`.
- **Search Bottleneck:** `ilike %term%` search will degrade as the `tasks` table grows. Needs Postgres GIN indexes or `tsvector`.
- **Sidebar Bloat:** `KairosWeb.SidebarComponent` handles Area/Project management and UI states. Should be decomposed into smaller LiveComponents.

### Planning Gaps
- **Missing Domain Fields:** `_old/` has `duration`, `durationUnit`, and `tags`. Tags partially added (`tags` migration exists), but `duration`/`durationUnit` are absent from schema.
- **Recurrence:** Recurring tasks (Daily, Weekly) are unplanned but required for Todoist parity.

---

## 5. Roadmap for Improvement

### Immediate (Security)
1. **Context Scoping:** Add `scope(query, user_id)` helper in base contexts for automatic ownership filtering.
2. **Verify Ownership on Linking:** Update `Links.create_link/1` to take `user_id` and validate entity ownership.

### Short-term (Features & UX)
1. **Drag-and-Drop:** Integrate `Sortable.js` with LiveView JS Hooks for manual reordering (`position` updates).
2. **Bulk Actions:** Multi-select for batch completion/deletion in Inbox and Project views.
3. **Duration Fields:** Add `duration` and `duration_unit` to Task schema.

### Long-term (Scalability & Polish)
1. **Full-Text Search:** Move from `ilike` to Postgres Full-Text Search with `tsvector` and `tsquery`.
2. **Component Refactoring:** Extract Area and Project management into smaller LiveComponents.
3. **Calendar View:** Month-view for tasks with `due_date`, using the real-time broadcast engine.
4. **Recurrence:** Recurring tasks with `rrule`-style scheduling.
