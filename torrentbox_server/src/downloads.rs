//! Handles checking whether a torrent's files are fully downloaded by verifying
//! each file exists on the filesystem at the configured downloads location.

use std::path::Path;

use crate::config::Config;
use crate::transmission_rpc::Torrent;

/// Returns `true` if all files associated with the torrent exist on the filesystem
/// at the location specified by the config's `downloads` setting.
///
/// The torrent's own directory (`torrent.path`) is used as a base for resolving file
/// paths, unless it is empty, in which case the configured `downloads` location is
/// used as the base. Both Windows (`C:\...`) and Unix (`/...`) paths are supported.
pub(crate) fn files_are_downloaded(torrent: &Torrent, config: &Config) -> bool {
    if torrent.path.is_empty() {
        return false;
    }

    for file in &torrent.files {
        if file.path.is_empty() {
            continue;
        }

        let resolved_path = if file.path.starts_with('/')
            || file.path.starts_with("C:\\")
            || file.path.starts_with("C:/")
        {
            file.path.clone()
        } else {
            let base = if torrent.path.is_empty() {
                let normalized = config.downloads.trim_end_matches('/');
                if normalized.is_empty() {
                    return false;
                }
                normalized
            } else {
                torrent.path.trim_end_matches('/')
            };

            format!(
                "{base}{}{}",
                if base.ends_with('/') { "" } else { "/" },
                &file.path
            )
        };

        if resolved_path.contains('\\') {
            if !Path::new(&resolved_path).exists() {
                return false;
            }
            continue;
        }

        if !Path::new(&resolved_path).exists() {
            return false;
        }
    }

    true
}
