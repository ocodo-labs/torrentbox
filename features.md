# TorrentBox — Feature List

TorrentBox is a **couch-view frontend for Transmission**, focused on torrent discovery and media-file organization rather than comprehensive torrent administration.

## 1. Torrent Discovery

- Search supported torrent sources.
- Pin and reorder frequently used searches.
- Filter search results by words or regular expressions.
- View torrent names, sizes, and seed counts.
- Filter out unwanted results, including unseeded and adult-category results.
- Open source listings, check for existing downloads, look up poster images, and search titles on Google.
- Add torrents to Transmission from search results or a pasted magnet link.

Relevant frontend files:
- `src/components/torrent-search/torrent-search.tsx`
- `src/components/torrent-search/torrent-search-result-row.tsx`

## 2. Torrent Overview and Actions

- View torrents and their download progress.
- Inspect transfer speed, total size, seed/leecher counts, and download counts.
- Expand multi-file torrents and inspect individual file progress.
- Select individual torrents or multiple torrents.
- Remove torrents or delete torrents and their data.
- Rename torrents and individual files.
- Mark individual torrent files for deletion.

Relevant frontend files:
- `src/components/torrent-section.tsx`
- `src/components/torrent-row.tsx`
- `src/components/torrent-file-row.tsx`

## 3. Smart Renaming Engine — Deterministic, Not AI

TorrentBox includes a dedicated local **media-renaming engine**, implemented in `src/lib/rename/om-rename-engine.ts`.

- Normalize filenames by cleaning separators, whitespace, and release-name noise.
- Recognize TV episode naming patterns and format season/episode identifiers consistently.
- Recognize movie titles and years.
- Preserve file extensions where appropriate.
- Automatically title eligible video files.
- Batch-rename TV season files, preview proposed names, and apply text replacements or regular-expression transformations.
- Rename individual torrents, torrent files, and completed downloads.

The engine uses configured patterns and deterministic string-processing rules. It does **not** require an LLM to perform smart renaming. This is existing functionality to preserve in the Axum rewrite, not an Ollama feature to replace.

Relevant frontend file:
- `src/lib/rename/om-rename-engine.ts`

## 4. Completed-Download Organization

- Browse completed downloads in a separate Downloads tab.
- Move downloaded media into configured destinations for TV shows, movies, books, audiobooks, music, and software.
- Rename or delete downloaded files.
- Reveal additional destination actions when needed.

Relevant frontend file:
- `src/components/downloaded/downloaded-file-row.tsx`

## 5. Application Utilities

- Add magnet links directly.
- Open configured external links.
- View server storage usage and available space.
- Configure server-related settings.
- Switch between light, dark, and Olivetti-inspired themes.
- Display a clock and report connection errors.

Relevant frontend files:
- `src/components/heading-bar.tsx`
- `src/components/server-config-modal.tsx`

## Architectural Boundary

TorrentBox relies on Transmission for torrent execution and state. It does not aim to replace Transmission's web UI or provide a complete torrent-administration interface.

For the Axum rewrite, prioritize preserving the frontend's actual workflows and the smart local renaming engine, without carrying forward an unnecessary Ollama dependency.