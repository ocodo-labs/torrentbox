# AGENTS.md

## Practices

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

## Building the Client

```bash
vite build
```

The built output goes to `apiserver/dist`, which the server serves as static files.

> **Note:** `vite dev` is only needed when evaluating instant styling changes or triaging difficult client-side quirks. For normal development, build and serve via the server.
