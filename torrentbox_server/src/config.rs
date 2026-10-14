#![allow(dead_code)]

use serde::{Deserialize, Serialize};
use std::{
    env, fs, io,
    path::{Path, PathBuf},
};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Config {
    #[serde(default)]
    pub mounts: Vec<String>,

    pub downloads: String,

    #[serde(default)]
    pub external_links: Vec<ExternalLink>,

    pub media: ConfigMediaSettings,

    pub transmission: ConfigTransmissionSettings,

    pub valid_extensions: Vec<String>,

    #[serde(default)]
    pub filters: ConfigFiltersSettings,

    pub images: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ConfigMedia {
    pub directory: String,

    #[serde(default)]
    pub wrap: Option<bool>,

    pub exts: Vec<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
pub struct ConfigMediaSettings {
    pub audiobooks: ConfigMedia,
    pub books: ConfigMedia,
    pub movies: ConfigMedia,
    pub music: ConfigMedia,
    pub software: ConfigMedia,
    pub tvshows: ConfigMedia,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigTransmissionSettings {
    pub port: u16,
    pub host: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ConfigFiltersSettings {
    #[serde(default)]
    pub words: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ExternalLink {
    pub name: String,
    pub href: String,
}

impl Config {
    /// Load config.yaml from the process working directory.
    pub fn load() -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        Self::load_from(env::current_dir()?.join("config.yaml"))
    }

    /// Load configuration from an explicit path.
    pub fn load_from(
        path: impl AsRef<Path>,
    ) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let path: PathBuf = path.as_ref().to_path_buf();

        let contents = fs::read_to_string(&path).map_err(|e| {
            io::Error::new(
                e.kind(),
                format!("Failed to read config file '{}': {e}", path.display()),
            )
        })?;

        serde_saphyr::from_str(&contents).map_err(|e| {
            io::Error::new(
                io::ErrorKind::InvalidData,
                format!("Invalid configuration in '{}': {e}", path.display()),
            )
            .into()
        })
    }
}
