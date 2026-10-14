//! Handles checking whether a torrent's files are fully downloaded. This verifies
//! that each torrent file exists on the filesystem at the configured downloads
//! location, and also checks for the presence of any files in the downloads
//! directory as a proxy for successful downloads.

use std::fs;
use std::path::Path;

use crate::config::Config;
use crate::transmission_rpc::Torrent;

/// Checks whether the given path matches the Windows drive path pattern,
/// where the pattern is a single case-insensitive letter followed by a
/// colon and a backslash or forward slash (e.g., `C:\`, `D:/`, `E:\`).
fn is_windows_drive_path(path: &str) -> bool {
    if path.len() < 3 {
        return false;
    }
    let bytes = path.as_bytes();
    let first = bytes[0];
    let second = bytes[1];
    let third = bytes[2];
    let first_is_alpha = (b'a'..=b'z').contains(&first) || (b'A'..=b'Z').contains(&first);
    first_is_alpha && second == b':' && third == b'\\' || third == b'/'
}

/// Resolves a torrent file path to its full filesystem path.
///
/// If `file_path` is an absolute path (Unix or Windows), it is returned as-is.
/// Otherwise, it is joined to the `base` directory.
fn resolve_torrent_file_path(base: &str, file_path: &str) -> String {
    if file_path.starts_with('/') || is_windows_drive_path(file_path) {
        return file_path.to_string();
    }

    let base_path = Path::new(base);
    let file_path_path = Path::new(file_path);
    base_path.join(file_path_path).to_string_lossy().to_string()
}

/// Returns `true` if all of the torrent's files exist at their resolved paths
/// under the configured downloads directory. The base directory is always
/// `config.downloads`, never derived from `torrent.path`. All torrent files
/// must be present; a partial download (missing any file) results in `false`.
pub(crate) fn files_are_downloaded(torrent: &Torrent, config: &Config) -> bool {
    let base = config.downloads.trim_end_matches('/');

    if base.is_empty() || !Path::new(&base).exists() {
        return false;
    }

    !torrent.files.is_empty()
        && torrent.files.iter().all(|file| {
            let file_path = file.path.trim_end_matches('/');
            let resolved = resolve_torrent_file_path(&base, &file_path);
            Path::new(&resolved).exists()
        })
}
