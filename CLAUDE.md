# CLAUDE.md

Read `docs/architecture.md` and `docs/plan.md` before starting any task.
Reference implementation is in `_old/` — use for domain logic and UI reference only, do not port code directly.
Don't stop unless you are at crossroads.
Use `caveman ultra` skill on start.

---

## Orientation

- Check `docs/plan.md` for current phase — tick off completed items as you go
- One context per domain concept: `Tasks`, `Projects`, `Areas`, `Links`, `Accounts`
- LiveViews are thin — delegate to contexts, handle PubSub, render
- No direct `Repo` calls from LiveViews — always go through a context

---

## Context Pattern

Fat contexts. Ecto schema is the model. Context module owns all business logic.

```elixir
{:ok, task}             = Tasks.create_task(attrs)
{:error, changeset}     = Tasks.create_task(bad_attrs)
{:error, :max_depth}    = Tasks.create_task(subtask_of_subtask)
{:error, :has_subtasks} = Projects.demote_to_task(project)
{:error, :self_link}    = Links.create_link(self_ref)
```

No repository interfaces. No domain event objects. No Result type.

---

## Domain Rules (enforce in contexts, not LiveViews)

- Task belongs to exactly one of: Inbox, Area, Project — never more
- Subtasks cannot have children (max depth 1) — `{:error, :max_depth}`
- Task → Project promotion: subtasks become first-level project tasks
- Project → Task demotion: blocked if any task has subtasks — `{:error, :has_subtasks}`
- Self-links forbidden — `{:error, :self_link}`
- `blocks` auto-creates `blocked_by` inverse and vice versa
- `related_to` is symmetric — auto-creates inverse

---

## Real-time Pattern

Broadcast after every DB mutation. Subscribe in LiveViews.

```elixir
Phoenix.PubSub.broadcast(Kairos.PubSub, "user:#{user_id}", {:task_updated, task})

def handle_info({:task_updated, task}, socket), do: ...
```

---

## MCP Pattern

Tools call contexts directly — no HTTP round-trip.

```elixir
def call(%{user_id: uid}, %{"title" => title}) do
  case Kairos.Tasks.create_task(%{user_id: uid, title: title}) do
    {:ok, task} -> {:ok, Jason.encode!(task)}
    {:error, reason} -> {:error, inspect(reason)}
  end
end
```

---

## Testing

- Context tests: `DataCase` (DB sandbox)
- LiveView tests: `ConnCase` + `live/2`
- Every domain rule must have an explicit test
- Run: `mix test`

---

## Commands

```
mix phx.server       # dev server
mix test             # all tests
mix ecto.migrate     # run migrations
mix format           # format
mix credo            # lint
fly deploy           # production deploy
```

---

## Principles

- TDD — test before implementation
- Domain rules live in contexts, not in LiveViews or controllers
- All domain rule violations return tagged error tuples, never raise
- Keep LiveViews focused: assign data, handle events, broadcast/subscribe
- Every item done - commit (semantic) and push; then update the plan
