# TorrentBox Axum Server — Implementation Handoff

## Purpose

Implement a Rust/Axum backend in `axum_server/` to replace the existing FastAPI backend in `apiserver/app.py`, preserving the behavior required by the TorrentBox frontend.

Treat this as a fresh implementation guided by the actual repository, not as a blind translation of guessed features or a commitment to every placeholder module already created.

## Product Definition

TorrentBox is a **couch-view frontend for Transmission**. It helps users discover torrents and organize downloaded media. It is not intended to replace Transmission's web UI or become a comprehensive torrent-administration client.

Transmission remains authoritative for torrent execution and state. TorrentBox provides the frontend workflows and integration logic that make torrent discovery, monitoring, renaming, and media organization convenient.

## Essential Requirements

1. Inspect the actual frontend source and existing FastAPI implementation before deciding which endpoints and behaviors to port.
2. Preserve the API contract required by the frontend: paths, HTTP methods, request and response shapes, status codes, and relevant side effects.
3. Preserve the smart media/torrent renaming engine. It is **deterministic local logic, not AI**. Do not replace it with an LLM or assume Ollama is required.
4. Remove the redundant Ollama dependency. Do not add an Ollama client, configuration, environment variables, crate dependencies, or runtime service requirement.
5. Keep Transmission responsible for torrent state and operations. Do not build a replacement torrent engine or a full Transmission web-interface clone.
6. Keep the existing Python server available as a reference until the Rust implementation has been checked against it.
7. Avoid adding infrastructure, abstractions, endpoints, or dependencies without evidence that the application needs them.

## Repository Context

The staged scaffold contains:

- `axum_server/BRIEF.md`
- `axum_server/Cargo.toml`
- `axum_server/src/main.rs`
- `axum_server/src/lib.rs`
- `axum_server/src/config.rs`
- `axum_server/src/state.rs`
- `axum_server/src/error.rs`
- `axum_server/src/routes/` — config, health, LLM, pinned queries, search, system, and torrents
- `axum_server/src/services/` — media, Redis, scraper, and Transmission
- Root-level `features.md`

Treat these files as a starting scaffold, not proof that every module or route is needed. In particular, review and remove `routes/llm.rs` if it exists only for the redundant Ollama integration. Retain any non-AI functionality that the frontend actually uses.

## Architecture Guidance

Use a small, understandable Axum service:

- `main.rs`: initialize logging, load configuration, build shared state, bind the listener, and serve the application.
- `lib.rs`: expose router construction so routes can be tested without starting a real listener.
- `config.rs`: typed configuration matching the existing application's actual configuration and environment overrides.
- `state.rs`: shared clients and application state that are actually needed.
- `error.rs`: consistent error conversion and HTTP responses, preserving existing error contracts where required.
- `routes/`: handlers grouped by actual frontend/API responsibility.
- `services/`: integrations and reusable business logic, not thin wrappers that add no value.
- Tests: contract and integration tests.

Use Tokio and Axum with Serde for HTTP/JSON. Add Redis, HTTP, YAML, HTML parsing, and logging crates only where confirmed necessary by the existing code. Reuse long-lived clients and configure reasonable timeouts.

Redis may support existing features such as pinned queries or caching; it is not a reason to introduce a new database. Preserve the existing use of Transmission, YAML configuration, and filesystem storage. Do not introduce a conventional database unless repository evidence establishes a real requirement.

## Required Work Sequence

### 1\. Inspect Before Implementing

Read the relevant files from the actual repository:

- `apiserver/app.py` and its imported modules.
- Frontend API clients, hooks, contexts, and components under `src/`.
- The current `axum_server/Cargo.toml` and all scaffold modules.
- Configuration examples, deployment files, and scripts that affect runtime behavior.
- The smart renaming engine and its tests, if present.

Build an endpoint inventory mapping each existing API route to its frontend caller. Record methods, inputs, output shapes, error behavior, dependencies, and side effects. Identify backend-only routes and determine whether they are still needed before porting them.

### 2\. Establish a Compiling Foundation

Make the smallest working Axum service with typed configuration, shared state, common errors, logging, graceful shutdown, and a testable router. Add a health endpoint if appropriate to the current deployment.

Run `cargo fmt --check`, `cargo check`, and relevant tests. Fix compiler errors before expanding functionality.

### 3\. Port Real Functionality in Dependency Order

Implement the required functionality based on the endpoint inventory. Keep handlers thin and move reusable integration logic into services when that makes the code clearer. Preserve API contracts and filesystem/Transmission side effects.

Do not infer UI features from backend endpoint names. Implement the workflows that the frontend actually uses, plus backend functionality proven necessary by the repository or deployment.

### 4\. Preserve Smart Renaming

Inspect the existing deterministic renaming implementation and identify where it is used. Port or reuse equivalent logic in Rust as appropriate, preserving its input/output behavior and edge cases.

Include tests for representative movie names, TV episode names, extensions, and unusual filenames based on actual existing behavior.

Renaming must not depend on Ollama, an LLM, or a network model service.

### 5\. Verify Compatibility Before Cutover

Test the Rust router and service behavior. Compare Python and Rust responses for representative equivalent requests. Verify frontend integration, Transmission operations, Redis-backed features if used, configuration loading, and filesystem actions.

Test destructive operations carefully, distinguishing removal of a torrent from deletion of downloaded data. Keep Python available for rollback until compatibility is accepted.

## Error Handling and Security

- Validate client input and filesystem paths.
- Preserve existing status codes and error payloads where frontend behavior depends on them.
- Apply timeouts to outbound requests.
- Handle unavailable Transmission, Redis, and external scraper services without crashing the whole server.
- Do not leak credentials, secrets, or sensitive server paths in responses.
- Avoid broad filesystem permissions or deletion behavior beyond the existing intended scope.

## Explicit Non-Goals

- Rewriting the frontend.
- Replacing Transmission or its torrent engine.
- Reproducing every feature of Transmission's web interface.
- Adding AI-based renaming or another LLM provider.
- Introducing a new database without demonstrated need.
- Porting unused backend routes merely because they exist.
- Adding speculative features or unnecessary abstractions.

## Definition of Done

- The Axum service builds and runs independently from `axum_server/`.
- All frontend-required API workflows are implemented and contract-tested.
- Smart deterministic renaming is preserved without Ollama.
- Transmission remains the authority for torrent state and execution.
- Configuration, Redis use, scraping, and filesystem behavior match actual repository requirements.
- Tests cover important API contracts and side effects.
- Build, run, and configuration instructions are documented.
- The Python implementation remains available until the Rust service passes compatibility checks.

## Working Style

Work from source evidence. If a feature, endpoint, or dependency is not verified in the repository, inspect it rather than guessing. Prefer a small, correct implementation over a broad speculative one. Report meaningful decisions and verification results concisely.

