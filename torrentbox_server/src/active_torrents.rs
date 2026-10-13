use axum::{Json, extract::State};
use serde_json::{Value, json};

use crate::AppState;

/// GET /api/torrents/active
///
/// Preserves the legacy Python response contract:
/// {
///     "downloading": [...],
///     "downloaded": [...]
/// }
///
/// Filesystem discovery is deliberately stubbed for now.
#[utoipa::path(
    get,
    path = "/api/torrents/active",
    tag = "Torrents",
    responses(
        (status = 200, description = "Active torrents and downloaded files")
    )
)]
pub async fn active_torrents(State(state): State<AppState>) -> Json<Value> {
    match state.transmission.get_torrents().await {
        Ok(torrents) => {
            let downloading: Vec<Value> = torrents
                .into_iter()
                .map(|torrent| {
                    let percent = if torrent.size_when_done > 0 {
                        let completed = torrent.size_when_done - torrent.left_until_done;

                        ((completed as f64 / torrent.size_when_done as f64) * 100.0) as i64
                    } else {
                        0
                    };

                    json!({
                        "files": torrent.files,
                        "id": torrent.hash_string,
                        "name": torrent.name,
                        "addedDate": torrent.added_date as f64,
                        "percent": percent,
                        "speed": torrent.rate_download,
                        "total": torrent.size_when_done,
                        "stats": torrent.tracker_stats,
                        "ratio": torrent.ratio,
                        "downloadRate": torrent.rate_upload,
                        "uploadRate": torrent.rate_download,
                        "secondsDownloading": torrent.seconds_downloading,
                        "magnet": torrent.magnet_link,
                    })
                })
                .collect();

            Json(json!({
                "downloading": downloading,
                "downloaded": [],
            }))
        }
        Err(err) => {
            tracing::error!(error = %err, "Failed to fetch torrents");

            Json(json!({
                "error": format!("Failed to fetch torrents: {err}")
            }))
        }
    }
}
