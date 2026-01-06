# Move-to Rules & Special-Case Handling

These notes define the authoritative behavior for `move_to`.

## Core Rules

- **Destination is always a SERIES folder**
  - Season folders or individual episode files are never direct move targets.
  - All moves resolve to a location *inside* the series folder.
  - Episodes may be placed directly in the series root **only if no season sub-folders exist**.
- **No symlinks**
  - Symlinks are not created, followed, or preserved.
- **No overwrites**
  - Existing destination files are preserved.
  - Incoming duplicates are skipped and recorded in `Download.skipped`.

- - -

## Canonical Series Destination States

A series destination folder MUST be in exactly one of the following states:

1. **Empty**
   - No episode files
   - No season sub-folders

2. **Season 01 flat**
   - Episode files exist in the series root
   - All episodes belong to **Season 01**
   - No season sub-folders exist
   - This is the default initial layout for a newly created or first-season series

3. **Multi-flat**
   - Episode files exist in the series root
   - Episodes belong to **more than one season**
   - No season sub-folders exist
   - This state is possible when multiple seasons are downloaded before structured folders exist

4. **Multi-nested**
   - One or more season-named sub-folders exist
   - All episode files are located inside those folders
   - No episode files exist in the series root

5. **Invalid / Ambiguous**
   - Episodes exist both in the root and in season folders
   - Or season folders exist but do not fully account for all episodes

**Note:** Series may evolve through these states as follows:
**Empty -> Season 01 flat -> Multi-nested**, or
**Multi-flat -> Multi-nested**.
There is no transition from multi-nested back to flat layouts.

- - -

## Destination Preparation

- If the destination series folder does not exist:
  - Create it using `mkdir(parents=True, exist_ok=True)`
  - The initial state is **Empty**
- An **Empty** destination becomes **Season 01 flat** upon receiving its first episode file.

- - -

## Basic Move-to Behaviour

### Source: Single Episode File

- Determine destination layout:
  - If destination is **multi-nested**:
    - Place the episode into the appropriate season sub-folder.
  - If destination is **Empty**, **Season 01 flat**, or **Multi-flat**:
    - Place the episode into the series root.
- If the destination file already exists:
  - Skip the file.
  - Record the full source path in `Download.skipped`.

- - -

### Source: Episode Folder (contains exactly one episode file)

- Treat the folder as an atomic unit.
- Move the folder into the series destination.
- If destination is **multi-nested**:
  - Place the folder into the appropriate season sub-folder.
- If a folder with the same name already exists:
  - Merge contents.
  - Skip duplicate files and record them.

- - -

### Source: Season Folder (contains multiple episode files)

Determine destination layout strictly before acting.

- If `is_multi_nested(destination)` is True:
  - Rename the incoming season folder using
    `season_folder_pattern(destination)`.
  - Move it into the series folder as a season sub-folder.
  - If a season folder with the same name exists:
    - Merge contents.
    - Skip duplicate episode files.

- If destination is **Season 01 flat**:
  - Apply **Flat-Root -> Structured-Root Conversion** (see below).

- If destination is **Multi-flat**:
  - Apply **Flat-Root -> Structured-Root Conversion** for all seasons:
    - Create season sub-folders using `season_folder_pattern()`.
    - Move each episode file into its corresponding season folder.
    - The destination becomes **multi-nested**.

- If destination is **Empty**:
  - Treat first season episodes as **Season 01 flat**.
  - Move accordingly.

- If destination layout is invalid:
  - Abort the operation.
  - Require user intervention.

- - -

### Source: Series Folder (contains multiple season folders)

- Destination MUST already be a series folder.
- Merge the source series folder into the destination series folder.
- For each incoming episode file:
  - If the destination file exists:
    - Skip it.
    - Record the source path in `Download.skipped`.
  - Otherwise:
    - Move the file.
- No deletion or replacement occurs.

- - -

## Conflict Handling

- **Folder name collision**
  - Merge folders recursively.
  - Never delete or replace destination content.
- **File name collision**
  - Skip the incoming file.
  - Append the source path to `Download.skipped`.

- - -

## File Filtering

- Only files whose suffix matches `video_exts` are considered.
- All non-video files (`.txt`, `.jpg`, etc.) are ignored.
- Ignored files are neither moved nor recorded.

- - -

## Path Handling

- All filesystem operations use `Path` objects.
- Paths containing spaces or special characters are handled implicitly.

- - -

## Destination Layout Handling

- Use explicit checks to distinguish **Empty**, **Season 01 flat**, **Multi-flat**, and **Multi-nested**.
- `is_multi_flat(destination)` exists as a **predicate** for legacy detection.
  - True if episodes exist in the root and belong to multiple seasons.
  - Can transition to **Multi-nested**.
- Move behavior MUST branch strictly on these states.
- If the layout is **Invalid / Ambiguous**:
  - Abort the move.
  - No automatic repair occurs inside `move_to`.

- - -

## Special-Case: Flat-Root -> Structured-Root Conversion

This is the ONLY implicit structural conversion allowed during `move_to`.

### Scenario 1: Season 01 flat -> Multi-nested

- Destination series is **Season 01 flat**.
- Source is a downloaded season folder for a different season (e.g., Season 02).

### Scenario 2: Multi-flat -> Multi-nested

- Destination series is **Multi-flat**.
- Source can be any season folder or episode.
- Conversion steps:
  1. Create season sub-folders for all existing episodes using `season_folder_pattern()`.
  2. Move each episode into its corresponding season folder.
  3. Move the incoming source files into their appropriate season folders.
  4. The destination becomes **multi-nested**.

No other flat-to-structured or structured-to-flat conversion is permitted.

- - -

## Storage Analysis Helpers

`StorageTVSeriesStructureAnalysis` exposes:

### `is_season01_flat`
True if:
- Episode files exist in the series root
- All episodes belong to **Season 01**
- No season sub-folders exist

### `is_multi_flat`
- Exists only as a **predicate**.
- True if episodes exist in the root and belong to multiple seasons.
- Never a target layout by itself; can transition to multi-nested.

### `is_multi_nested`
True if:
- One or more season-named sub-folders exist
- All episode files are located inside those folders
- No episode files exist in the series root

### Invalid / Ambiguous Layout
- Any layout that does not satisfy exactly one of the above predicates.
- `move_to` MUST abort when encountered.

- - -

## Caller Overrides

### `force_flat` / `force_structured`

- Overrides are honored ONLY when the current layout is valid and deterministic.
- If layout is invalid:
  - Overrides are ignored.
  - An exception is raised.

### `effective_keep_flat()`

- If destination is **Season 01 flat**:
  - Remain flat unless `force_structured` is set.
- If destination is **Multi-flat**:
  - Remain flat unless `force_structured` is set.
- If destination is **multi-nested**:
  - Remain structured unless `force_flat` is set.
- If destination is **Empty**:
  - Treat as **Season 01 flat** for override purposes.
- If layout is invalid:
  - Raise an exception.

- - -

## Cleanup Tracking

- `Download` includes:
  ```python
  skipped: list[str]
````

- Each skipped entry stores the full source path of the skipped file.
- Cleanup and deletion logic is explicitly out of scope for `move_to`.

- - -

## Implementation Constraints

- Logical inconsistencies MUST be resolved, not deferred.
- The rules in this document are executable specifications.
- Tests must map 1:1 with these behaviors.
- Default series destination states are limited to:

  - Empty
  - Season 01 flat
  - Multi-flat (predicate only)
  - Multi-nested
- Series evolve strictly as:
  **Empty -> Season 01 flat -> Multi-nested**
  or
  **Multi-flat -> Multi-nested**
- No operation may result in a mixed flat/nested layout.

- - -

# LLM instructions

- Maintain logical internal consistency and alert user for violations.
