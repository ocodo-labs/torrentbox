use axum::{Json, extract::State};
use serde_json::{Value, json};

use crate::AppState;
use crate::downloads::files_are_downloaded;

/// GET /api/torrents/active
///
/// Preserves the legacy Python response contract:
/// {
///     "downloading": [...],
///     "downloaded": [...]
/// }
///
/// Returns torrents that are actively downloading and those that have all their
/// files present on the filesystem at the configured downloads location.
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
                .iter()
                .filter(|torrent| torrent.seconds_downloading > 0)
                .filter_map(|torrent| {
                    let percent = if torrent.size_when_done > 0 {
                        let completed = torrent.size_when_done - torrent.left_until_done;

                        ((completed as f64 / torrent.size_when_done as f64) * 100.0) as i64
                    } else {
                        0
                    };

                    Some(json!({
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
                    }))
                })
                .collect();

            let downloaded: Vec<Value> = torrents
                .iter()
                .filter(|torrent| files_are_downloaded(torrent, &*state.config))
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
                "downloaded": downloaded,
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

// The `downloaded` array is populated using the downloads module's file existence check.
