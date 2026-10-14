mod active_torrents;
mod config;
mod downloads;
mod transmission_rpc;

use axum::{
    Json, Router,
    extract::State,
    http::StatusCode,
    response::{Html, IntoResponse},
    routing::get,
};
use config::Config;
use serde::Serialize;
use std::{env, net::SocketAddr, sync::Arc};
use tokio::net::TcpListener;
use tower_http::services::{ServeDir, ServeFile};
use tracing_subscriber::EnvFilter;
use transmission_rpc::TransmissionRpc;
use utoipa::OpenApi;

#![allow(clippy::all, dead_code, edition_issues)]

#[derive(Clone)]
pub(crate) struct AppState {
    pub(crate) config: Arc<Config>,
    pub(crate) transmission: Arc<TransmissionRpc>,
}

#[derive(Serialize, utoipa::ToSchema)]
struct HealthResponse {
    status: &'static str,
}

#[utoipa::path(
    get,
    path = "/health",
    tag = "Health",
    responses(
        (status = 200, description = "Server is healthy", body = HealthResponse)
    )
)]
async fn health() -> (StatusCode, Json<HealthResponse>) {
    (StatusCode::OK, Json(HealthResponse { status: "ok" }))
}

#[utoipa::path(
    get,
    path = "/api/config",
    tag = "Configuration",
    responses(
        (status = 200, description = "Application configuration", body = Value)
    )
)]
async fn config_info(State(state): State<AppState>) -> impl IntoResponse {
    match serde_json::to_value(&*state.config) {
        Ok(config) => (StatusCode::OK, Json(config)).into_response(),
        Err(err) => {
            tracing::error!(error = %err, "Failed to serialize configuration");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to serialize configuration",
            )
                .into_response()
        }
    }
}

#[derive(OpenApi)]
#[openapi(
    paths(
        health,
        config_info,
        active_torrents::active_torrents
    ),
    components(schemas(HealthResponse)),
    tags(
        (name = "Health", description = "Server health"),
        (name = "Configuration", description = "Application configuration"),
        (name = "Torrents", description = "Torrent operations"),
    ),
    info(
        title = "Torrentbox Server API",
        version = "0.1.0",
        description = "Backend API for the Torrentbox self-hosted application"
    )
)]
struct ApiDoc;

async fn openapi() -> Json<utoipa::openapi::OpenApi> {
    Json(ApiDoc::openapi())
}

async fn docs() -> Html<&'static str> {
    Html(
        r#"<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Torrentbox Server API</title>
</head>
<body>
    <redoc spec-url="/openapi.json"></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
</body>
</html>"#,
    )
}

async fn api_not_found() -> impl IntoResponse {
    (StatusCode::NOT_FOUND, "API endpoint not found")
}

fn app(state: AppState) -> Router {
    let frontend = ServeDir::new("dist")
        .append_index_html_on_directories(true)
        .not_found_service(ServeFile::new("dist/index.html"));

    Router::new()
        .route("/health", get(health))
        .route("/openapi.json", get(openapi))
        .route("/api/docs", get(docs))
        .route("/api/config", get(config_info))
        .route(
            "/api/torrents/active",
            get(active_torrents::active_torrents),
        )
        .route("/api/{*path}", get(api_not_found))
        .fallback_service(frontend)
        .with_state(state)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    let config = Arc::new(Config::load()?);
    let transmission = Arc::new(TransmissionRpc::new(Arc::clone(&config))?);

    tracing::info!("Configuration loaded successfully");

    let state = AppState {
        config,
        transmission,
    };

    let addr: SocketAddr = env::var("TORRENTBOX_BIND")
        .unwrap_or_else(|_| "0.0.0.0:8080".to_owned())
        .parse()?;

    let listener = TcpListener::bind(addr).await?;

    tracing::info!(
        address = %listener.local_addr()?,
        frontend = "./dist",
        "Torrentbox Server started"
    );

    axum::serve(listener, app(state))
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("failed to install SIGTERM handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    tracing::info!("Shutdown signal received");
}
