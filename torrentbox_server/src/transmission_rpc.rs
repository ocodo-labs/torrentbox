use serde::{Deserialize, Serialize};
use std::{error::Error, sync::Arc, time::Duration};

use crate::config::Config;

type RpcError = Box<dyn Error + Send + Sync>;

/// Transmission legacy RPC client.
///
/// Uses the pre-4.1 Transmission protocol (`method` / `arguments` / `tag`),
/// not JSON-RPC 2.0.
pub struct TransmissionRpc {
    client: reqwest::Client,
    url: String,
    session_id: tokio::sync::Mutex<Option<String>>,
}

#[derive(Debug, Serialize)]
struct RpcRequest<'a> {
    method: &'a str,
    arguments: serde_json::Value,
    tag: u64,
}

#[derive(Debug, Deserialize)]
struct RpcResponse {
    result: String,
    arguments: Option<serde_json::Value>,
    #[allow(dead_code)]
    tag: Option<u64>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Torrent {
    pub id: i64,

    #[serde(rename = "hashString")]
    pub hash_string: String,

    pub name: String,

    #[serde(rename = "addedDate")]
    pub added_date: i64,

    #[serde(rename = "sizeWhenDone")]
    pub size_when_done: i64,

    #[serde(rename = "leftUntilDone")]
    pub left_until_done: i64,

    #[serde(rename = "rateDownload")]
    pub rate_download: i64,

    #[serde(rename = "rateUpload")]
    pub rate_upload: i64,

    #[serde(rename = "uploadRatio", default)]
    pub ratio: f64,

    #[serde(rename = "secondsDownloading")]
    pub seconds_downloading: i64,

    #[serde(rename = "magnetLink")]
    pub magnet_link: String,

    #[serde(rename = "trackerStats", default)]
    pub tracker_stats: Vec<serde_json::Value>,

    #[serde(default)]
    pub files: Vec<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
struct TorrentGetResult {
    torrents: Vec<Torrent>,
}

impl TransmissionRpc {
    pub fn new(config: Arc<Config>) -> Result<Self, RpcError> {
        let host = config.transmission.host.trim();
        let port = config.transmission.port;

        if host.is_empty() {
            return Err("Transmission host must not be empty".into());
        }

        let url = format!("http://{host}:{port}/transmission/rpc");

        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(15))
            .build()?;

        Ok(Self {
            client,
            url,
            session_id: tokio::sync::Mutex::new(None),
        })
    }

    async fn call(
        &self,
        method: &str,
        arguments: serde_json::Value,
    ) -> Result<serde_json::Value, RpcError> {
        let request = RpcRequest {
            method,
            arguments,
            tag: 1,
        };

        let mut session_id = self.session_id.lock().await;

        for attempt in 0..2 {
            let mut builder = self.client.post(&self.url).json(&request);

            if let Some(id) = session_id.as_deref() {
                builder = builder.header("X-Transmission-Session-Id", id);
            }

            let response = builder.send().await?;

            if response.status() == reqwest::StatusCode::CONFLICT && attempt == 0 {
                let id = response
                    .headers()
                    .get("X-Transmission-Session-Id")
                    .ok_or("Transmission returned HTTP 409 without a session ID")?
                    .to_str()?
                    .to_owned();

                *session_id = Some(id);
                continue;
            }

            let response = response.error_for_status()?;
            let rpc: RpcResponse = response.json().await?;

            if rpc.result != "success" {
                return Err(format!("Transmission RPC '{method}' failed: {}", rpc.result).into());
            }

            return rpc.arguments.ok_or_else(|| {
                format!("Transmission RPC '{method}' returned no arguments").into()
            });
        }

        Err("Transmission RPC session negotiation failed".into())
    }

    /// Fetch all torrents and their file lists.
    pub async fn get_torrents(&self) -> Result<Vec<Torrent>, RpcError> {
        let arguments = serde_json::json!({
            "fields": [
                "id",
                "hashString",
                "name",
                "addedDate",
                "sizeWhenDone",
                "leftUntilDone",
                "rateDownload",
                "rateUpload",
                "uploadRatio",
                "secondsDownloading",
                "magnetLink",
                "trackerStats",
                "files"
            ]
        });

        let result = self.call("torrent-get", arguments).await?;
        let result: TorrentGetResult = serde_json::from_value(result)?;

        Ok(result.torrents)
    }
}
