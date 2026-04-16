# Kairos Project Review — April 2026

## 1. Executive Summary
Kairos is a robust, modern migration of a task management system to Elixir/Phoenix. The architecture leverages the strengths of the BEAM (concurrency, real-time PubSub) and provides a high-quality foundation for a Todoist-alternative. However, critical gaps exist in security (multi-tenancy for AI), implementation completeness (Links UI), and scalability.

---

## 2. Architecture & Strengths
- **Tech Stack:** Excellent choice of Phoenix 1.8.5 + LiveView 1.1.0 + Salad UI. This provides a "single-language" full-stack experience with high developer velocity.
- **Context Design:** Adheres strictly to the "Fat Context" pattern. Business logic is well-isolated from the web layer, ensuring consistency and ease of testing.
- **Real-time Synchronization:** Proper use of Phoenix PubSub ensures that mutations are broadcasted and reflected across all open tabs instantly.
- **AI Integration:** The inclusion of an MCP (Model Context Protocol) server is a forward-thinking feature that differentiates the app from traditional task managers.

---

## 3. Weaknesses & Critical Issues

### 🚨 Security Vulnerabilities
- **Single-Tenant MCP:** The MCP server (`Kairos.MCP.Server`) uses a global `mcp_api_token` and `mcp_user_id`. In a multi-user system, this is a **critical security flaw**. Any AI agent connecting via MCP would potentially access/modify data for only one hardcoded user or leak data across sessions.
- **IDOR (Insecure Direct Object Reference):**
    - `Kairos.Links.list_links_for/2`: No `user_id` check. An attacker could iterate IDs to discover dependencies across the entire database.
    - `Kairos.Links.create_link/1`: Does not verify that the requester owns both the `from` and `to` entities.
    - `Kairos.Tasks.check_max_depth/1`: Fetches parent tasks without verifying ownership.
- **Authorization Layer:** There is no centralized authorization logic. Ownership checks are performed manually in Ecto queries, which is error-prone as the application grows.

### 📉 Performance & Scalability
- **N+1 Update Operations:** `Tasks.promote_to_project/1` and `Projects.demote_to_task/1` iterate over lists and perform individual `Repo.update!` calls within a transaction. This should be refactored to use `Repo.update_all/3`.
- **Search Bottleneck:** The current `ilike %term%` search will become slow as the `tasks` table grows. It lacks Postgres GIN indexes or `tsvector` support.
- **Sidebar Bloat:** `KairosWeb.SidebarComponent` (36KB) is becoming a "God Component." It handles management logic for Areas, Projects, and UI states (renaming, deleting, menus). This logic should be decomposed.

---

## 4. Planning Gaps
- **Missing Domain Fields:** The reference implementation (`_old/`) contains `duration`, `durationUnit`, and `tags`. These are missing from the current Ecto schema and logic.
- **Feature Half-Life:** The `Links` context is implemented and tested in the backend, but it is completely invisible in the UI (not present in `TaskDetailComponent`).
- **Recurrence:** A "Todoist replacement" requires recurring tasks (Daily, Weekly, etc.), which is currently unplanned in the roadmap.

---

## 5. Roadmap for Improvement

### Immediate (Security & Stability)
1. **Multi-tenant MCP:** Refactor `AuthPlug` to validate per-user tokens and assign the correct `user_id` to the MCP frame dynamically.
2. **Context Scoping:** Implement a standard `scope(query, user_id)` function in `Kairos.Repo` or base contexts to ensure all queries are automatically filtered by owner.
3. **Verify Ownership on Linking:** Update `Links.create_link/1` to take a `user_id` and validate entity ownership.

### Short-term (Features & UX)
1. **Links UI:** Add a "Dependencies" or "Related" section to the Task Detail slide-in.
2. **Drag-and-Drop:** Integrate `Sortable.js` with LiveView JS Hooks to allow manual reordering of tasks (`position` updates).
3. **Bulk Actions:** Add multi-select capabilities to the `Inbox` and `Project` views for batch completion/deletion.

### Long-term (Scalability & Polish)
1. **Full-Text Search:** Move from `ilike` to Postgres Full-Text Search with `tsvector` and `tsquery`.
2. **Component Refactoring:** Extract Area and Project management into smaller, dedicated LiveComponents.
3. **Calendar View:** Implement a month-view for tasks with `due_date`, utilizing the same real-time broadcast engine.
