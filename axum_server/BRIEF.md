# Torrentbox Axum Server — Implementation Plan

## 1. Objective

Rewrite `apiserver/app.py` as an independent Rust/Axum service in the repository-root directory `axum_server/`. Preserve required behavior and frontend compatibility. Remove the redundant Ollama integration. Keep `apiserver/` available as a reference until the Rust implementation is verified.

## 2. Proposed Structure

```text
axum_server/
├── Cargo.toml
├── src/
│   ├── main.rs
│   ├── lib.rs
│   ├── config.rs
│   ├── state.rs
│   ├── error.rs
│   ├── routes/
│   │   ├── mod.rs
│   │   ├── health.rs
│   │   ├── config.rs
│   │   ├── torrents.rs
│   │   ├── search.rs
│   │   ├── pinned_queries.rs
│   │   └── system.rs
┖ services/
│       ├── mod.rs
│       ├── transmission.rs
│       ├── redis.rs
│       ├── scraper.rs
│       └── media.rs
└── tests/
```

Adjust modules to the actual route inventory; do not create unused abstractions.

## 3. Technology

- Axum and Tokio for HTTP and async execution.
- Serde and serde_json for request/response serialization.
- A maintained YAML crate for existing configuration files.
- An async Redis client for required Redis operations.
- Reqwest for Transmission and external HTTP requests.
- Scraper for HTML parsing.
- Tracing and tracing-subscriber for diagnostics.
- Thiserror for internal error definitions.

Use compatible maintained crate versions and include only dependencies required by implemented features.

## 4. Phase One — Foundation

- Create the Cargo package and executable/library entry points.
- Implement typed configuration loading and startup validation.
- Define shared application state and common error handling.
- Add structured logging, graceful shutdown, and CORS behavior.
- Implement the health endpoint.
- Preserve the existing API prefix.

Acceptance: `cargo check` succeeds; the service starts with valid configuration; invalid configuration fails with a useful diagnostic; health endpoint responds successfully.

## 5. Phase Two — API Inventory and Contracts

Enumerate every route and HTTP method in `apiserver/app.py`. For each route, document its path, inputs, request body, response format, status codes, side effects, dependencies, and frontend callers.

Port all required endpoints without unplanned contract changes. Preserve JSON field names, defaults, error formats, and status codes wherever the frontend relies on them.

Acceptance: every required existing route is accounted for; omissions or intentional removals are documented explicitly.

## 6. Phase Three — Configuration and Integrations

- Port YAML configuration and relevant environment-variable overrides.
- Implement required Redis operations.
- Implement a reusable Transmission client.
- Preserve path resolution and filesystem conventions.
- Configure timeouts for outbound requests and handle dependency failures cleanly.

Acceptance: existing configuration remains usable or changes are documented; Redis and Transmission errors are handled without crashing the service.

## 7. Phase Four — Torrent Management

Port existing operations as applicable: list/inspect torrents, add torrent or magnet links, remove torrents, delete downloaded data, clean up state, rename files, and move media into destination directories.

Preserve Transmission semantics and existing path conventions. Distinguish removing a torrent from deleting downloaded data. Validate paths and handle missing files, permission errors, and destination conflicts.

Acceptance: operations preserve intended side effects; destructive actions do not remove data beyond the original behavior.

## 8. Phase Five — Search and Media

Port required torrent-site scraping, search parameters and result formats, poster/metadata lookup, existing-media detection, media-storage listings, random-image functionality, and pinned-query behavior.

Acceptance: search results retain the existing API contract; external-site failures are handled; filesystem paths and media URLs remain frontend-compatible.

## 9. Phase Six — Remove Ollama

- Do not implement an Ollama client or add Ollama dependencies, configuration, or environment variables.
- Remove Ollama-only code and routes.
- Before removing any route, check whether the frontend calls it.
- Preserve required non-AI behavior, such as deterministic filename normalization, if the existing API depends on it.

Acceptance: no runtime code attempts to contact Ollama, and all remaining endpoints have defined behavior.

## 10. Phase Seven — Frontend and Deployment

- Preserve API prefix and static frontend serving if the current backend provides it.
- Verify the expected `dist/` location and deployment working directory.
- Document build, run, and configuration commands.
- Update deployment configuration only as necessary.
- Keep Python available for comparison and rollback until cutover is accepted.

Acceptance: frontend requests and static assets work without unplanned frontend changes; deployment no longer requires Ollama.

## 11. Phase Eight — Tests and Cutover

- Unit-test configuration, serialization, and error handling.
- Integration-test routes and service clients.
- Compare Python and Rust responses for equivalent requests.
- Test malformed requests, missing configuration, unavailable dependencies, and filesystem failures.
- Verify destructive operations in a controlled environment.
- Switch deployment only after required behavior passes verification.

Acceptance: required routes have regression coverage; response shapes and status codes are compatible; key external-service and filesystem side effects are verified.

## 12. Error Handling

Use a shared application error type and preserve existing response formats where required. Return appropriate client errors for invalid input, the expected status for missing resources, and server errors for unexpected failures. Log actionable diagnostics without exposing credentials, secrets, or sensitive internal paths.

## 13. Non-Goals

- Rewriting the frontend.
- Adding unrelated features.
- Replacing Redis or Transmission without a demonstrated need.
- Introducing a new database.
- Adding another LLM provider.
- Changing behavior solely to make the implementation more idiomatic.

## 14. Definition of Done

1. `axum_server/` builds and runs independently.
2. All required API endpoints are implemented.
3. Frontend and required integrations continue to work.
4. Ollama is not a runtime or deployment requirement.
5. Regression tests cover API contracts and important side effects.
6. Build, configuration, execution, and deployment instructions are documented.
7. The Python service can be retired without losing required functionality.
