.PHONY: install dev-server dev-client db-init db-migrate-duration db-fix-permissions build test test-watch \
        lint format format-check typecheck hooks clean help \
        deploy deploy-server deploy-client

PNPM := pnpm

# ── Development ───────────────────────────────────────────────────────────────

install: ## Install all workspace dependencies
	$(PNPM) install

dev-server: ## Start Fastify dev server (requires server/.env)
	$(PNPM) --filter server dev

dev-client: ## Start Vite dev client (requires client/.env)
	$(PNPM) --filter client dev

db-init: ## Initialize database using DATABASE_URL and migration SQL
	node scripts/db-init.mjs

db-migrate-duration: ## Add duration columns/constraints to existing tasks table
	node scripts/db-migrate-duration.mjs

db-migrate-position: ## Add position column for manual task ordering
	node scripts/db-migrate-position.mjs

db-fix-permissions: ## Grant table permissions to Supabase roles
	node scripts/db-fix-permissions.mjs

# ── Deploy ────────────────────────────────────────────────────────────────────

deploy: ## Deploy both server and client to Fly.io
	fly deploy --config fly.toml & fly deploy --config fly.client.toml & wait

deploy-server: ## Deploy server to Fly.io
	fly deploy --config fly.toml

deploy-client: ## Deploy client to Fly.io
	fly deploy --config fly.client.toml

# ── Build ─────────────────────────────────────────────────────────────────────

build: ## Build all packages (shared → server → client)
	$(PNPM) --filter shared build
	$(PNPM) --filter server build
	$(PNPM) --filter client build

build-server: ## Build server only
	$(PNPM) --filter server build

build-client: ## Build client only
	$(PNPM) --filter shared build && $(PNPM) --filter client build

# ── Testing ───────────────────────────────────────────────────────────────────

test: ## Run all tests once
	$(PNPM) --filter server test

test-watch: ## Run tests in watch mode
	$(PNPM) --filter server test:watch

# ── Code quality ──────────────────────────────────────────────────────────────

lint: ## Run oxlint across all packages
	$(PNPM) -r lint

format: ## Format all files with oxfmt
	$(PNPM) -r format

format-check: ## Check formatting without writing (CI-safe)
	$(PNPM) -r format:check

typecheck: ## Run tsc --noEmit across all packages
	$(PNPM) -r typecheck

check: lint format-check typecheck test ## Run all checks (lint + format + types + tests)

# ── Git hooks ─────────────────────────────────────────────────────────────────

hooks: ## Install lefthook git hooks (run once after git init)
	$(PNPM) lefthook install

# ── Utilities ─────────────────────────────────────────────────────────────────

clean: ## Remove all dist/ and node_modules/ directories
	rm -rf node_modules shared/node_modules shared/dist \
	       server/node_modules server/dist \
	       client/node_modules client/dist

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*##"}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
