# Project Context — TorrentBox

## Git Push Safety

**Never push to remote without explicit user confirmation.** Always ask the user before running `git push`. The agent may stage, commit, and verify tests, but the push itself requires a clear "yes" from the user.

## Running the Server

```bash
cd apiserver
.venv/bin/fastapi dev --port 8880 --host 0.0.0.0
```

> **Note:** Check if port 8880 is already in use before starting:
> ```bash
> lsof -i :8880 || ss -tlnp | grep 8880
> ```
> If something is listening, skip starting the server.

## Building the Client

```bash
vite build
```

Built output goes to `apiserver/dist`.

## Running Tests

```bash
npx vitest run
```

All 50 tests across 3 test files. Setup file is at `vitest.setup.tsx`.

## Plans

Active improvement plans are in `plans/`. Status is tracked in `plans/README.md`.
Execute with: `improve-react execute <plan>`
