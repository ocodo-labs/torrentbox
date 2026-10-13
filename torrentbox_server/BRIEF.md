# Torrentbox Server — Implementation Plan

## Objective

Rewrite `apiserver/app.py` as an independent Rust/Axum service in the repository-root directory `torrentbox_server/`. Preserve required behavior and frontend compatibility. Keep `apiserver/` available as a reference until the Rust implementation is verified.

## Technology

- Axum and Tokio for HTTP and async execution.
- Serde and serde_json for request/response serialization.
- A maintained YAML crate for existing configuration files.
- A persistent k/v store pinned queries operations. Can be Redis, doesn't have to be.
- Use of Transmission JRPC for a transmission instance
- Scraper for HTML parsing.
- Tracing and tracing-subscriber for diagnostics.
- Thiserror for internal error definitions.

Use compatible maintained crate versions and include only dependencies required by implemented features.

## Foundation

- Create the Cargo package and executable/library entry points.
- Implement typed configuration loading and startup validation.
- Define shared application state and common error handling.
- Add structured logging, graceful shutdown, and CORS behavior.
- Implement the health endpoint.
- Preserve the existing API prefix.

Acceptance: `cargo check` succeeds; the service starts with valid configuration; invalid configuration fails with a useful diagnostic; health endpoint responds successfully.

## API Inventory and Contracts

Enumerate every route and HTTP method in `apiserver/app.py`. For each route, document its path, inputs, request body, response format, status codes, side effects, dependencies, and frontend callers.

Port all required endpoints without unplanned contract changes. Preserve JSON field names, defaults, error formats, and status codes wherever the frontend relies on them.

Acceptance: every required existing route is accounted for; omissions or intentional removals are documented explicitly.

## Configuration and Integrations

- Port YAML configuration and relevant environment-variable overrides.
- Implement required kv store operations.
- Preserve path resolution and filesystem conventions.
- Configure timeouts for outbound requests and handle dependency failures cleanly.

Acceptance: existing configuration remains usable or changes are documented;

## Torrent Management

Torrents are managed by transmission, the server only adds magent links or lists torrents under control of transmisson and allows torrents and their folders, files to be renamed, or removed, or deleted, as per apiserver/app.py

## Search and Media

Port required torrent-site scraping, search parameters and result formats, poster/metadata lookup, existing-media detection, media-storage listings, random-image functionality, and pinned-query behavior.

Acceptance: search results retain the existing API contract; external-site failures are handled; filesystem paths and media URLs remain frontend-compatible.

- Preserve API prefix and static frontend serving if the current backend provides it.
- Verify the expected `dist/` location and deployment working directory.
- Document build, run, and configuration commands.
- Update deployment configuration only as necessary.
- Keep Python available for comparison and rollback until cutover is accepted.

## Tests and Cutover

Acceptance: frontend requests and static assets work without unplanned frontend changes;

- Unit-test configuration, serialization, and error handling.
- Integration-test routes and service clients.
- Compare Python and Rust responses for equivalent requests.
- Test malformed requests, missing configuration, unavailable dependencies, and filesystem failures.
- Verify destructive operations in a controlled environment.
- Switch deployment only after required behavior passes verification.

Acceptance: required routes have regression coverage; response shapes and status codes are compatible; key external-service and filesystem side effects are verified.

<<<<<<< Updated upstream
## Error Handling

Use a shared application error type and preserve existing response formats where required. Return appropriate client errors for invalid input, the expected status for missing resources, and server errors for unexpected failures. Log actionable diagnostics without exposing credentials, secrets, or sensitive internal paths.

## Methodology

TDD red-gree-refactor style development, with exploratory spikes to validate assumptions.

Favor integration spec/bdd style tests over brittle unit testing, ensure that modules or components which can be isolated are unit tested, do not do so for glue/page level ui etc. those should be covered using integration (thin "module sociability tests")

do not waste time with Cucumber or other test fallacies.

Follow Pivotal Labs methods, where applicable.

## Non-Goals

- Rewriting the frontend.
- Adding unrelated features.
- Replacing Redis or Transmission.
- Introducing a new database.
- Changing behavior solely to make the implementation more idiomatic.

## 14. Definition of Done

1. `torrentbox_server/` builds and runs independently.
2. All required API endpoints are implemented.
3. Frontend and required integrations continue to work.
4. Regression tests cover API contracts and important side effects.
5. Build, configuration, execution, and deployment instructions are documented.
6. The Python service can be retired without losing required functionality.
