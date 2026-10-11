# TorrentBox Axum Server — Implementation Handoff

## Purpose

Implement a Rust/Axum backend in `axum_server/` to replace the existing FastAPI backend in `apiserver/app.py`, while preserving the behavior required by the TorrentBox frontend.

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

The repository currently includes these staged Rust files:

```text
axum_server/
├── BRIEF.md
├── Cargo.toml
└── src/
    ├── main.rs
    ├── lib.rs
    ├── config.rs
    ├── state.rs
    ├── error.rs
    ├── routes/
    │   ├── mod.rs
    │   ├── config.rs
    │   ├── health.rs
    │   ├── llm.rs
    │   ├── pinned_queries.rs
    │   ├── search.rs
    │   ├── system.rs
    │   └── torrents.rs
    └── services/
        ├── mod.rs
        ├── media.rs
        ├── redis.rs
        ├── scraper.rs
        └── transmission.rs
```

There is also a root-level `features.md`. Treat these files as a starting scaffold, not as proof that every module or route is needed. In particular, review and remove `routes/llm.rs` if it only exists for the redundant Ollama integration. Retain any non-AI functionality that the frontend actually uses.

## Architecture Guidance

Use a small, understandable Axum service:

- `main.rs`: initialize logging, load configuration, build shared state, bind the listener, and serve the application.
- `lib.rs`: expose router construction so routes can be tested without starting a real listener.
- `config.rs`: typed configuration matching the existing application's real configuration and environment overrides.
- `state.rs`: shared clients and application state that are actually needed.
- `error.rs`: consistent error conversion and HTTP responses, preserving existing error contracts where required.
- `routes/`: handlers grouped by actual frontend/API responsibility.
- `services/`: integrations and reusable business logic, not thin wrappers that add no value.
- `tests/`: contract and integration tests.

Use Tokio and A