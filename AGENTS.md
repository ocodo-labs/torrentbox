# AGENTS.md

## Practices

### Git Push

**Never push to remote without explicit user confirmation.** Always ask the user before running `git push`. The agent may stage, commit, and verify tests, but the push itself requires a clear "yes" from the user.

### Commits

Commits should be verbose and read like a diary or journal entry. Describe what you did, why, and what you found. Avoid terse messages like "fix stuff" or "update file". Write as if someone (or future you) will read this months later and need to understand the reasoning.

Good:

```
feat: add reject mode to pinned queries check modal

Users can now batch-reject unwanted search results. Added a "Reject
Results" button below the results list that enters selection mode.
Rows become clickable with checkboxes. Selected items are persisted
to localStorage under "torrentbox:rejected-pinned-queries" and
silently filtered from future searches.

Also added a RejectedListManager tab in the Settings modal so users
can view, filter, and remove rejected items manually.
```

Bad:

```
fix: reject feature
```

## Running the Server

```bash
cd apiserver
.venv/bin/fastapi dev --port 8880 --host 0.0.0.0
```

> **Note:** The user likely already has the server running. Before starting it, check if port 8880 is already in use:
> ```bash
> lsof -i :8880 || ss -tlnp | grep 8880
> ```
> If something is listening, skip starting the server — the user probably has it running in another terminal.

## Building the Client

```bash
vite build
```

The built output goes to `apiserver/dist`, which the server serves as static files.

> **Note:** `vite dev` is only needed when evaluating instant styling changes or triaging difficult client-side quirks. For normal development, build and serve via the server.

## Running Tests

```bash
npx vitest run
```

Run a single test file:

```bash
npx vitest run src/components/rename-tvshow-view.test.tsx
```

Run in watch mode during development:

```bash
npx vitest
```

Tests use jsdom environment with `@` path alias resolution. Setup file is at `vitest.setup.tsx` with mocks for project dependencies, UI components, and the rename engine.
