# Move-to Rules & Special-Case Handling

- **Destination is always a series folder**. Season folders or individual episode files are never used as direct move targets; any episode or season is moved **into the appropriate sub-folder inside the series folder**.
  - Episodes may be placed directly in the series root **only if no season sub-folders exist**.
- Symlinks are not used in downloads or storage and can be considered out of scope.
- No overwrites; existing files are skipped and added to the download `skipped` list.

## Basic Move-to Behaviour

- **Destination directory does not exist** -> create it with `mkdir(parents=True, exist_ok=True)` before moving.
- **Source is a single episode file** -> move the file into the series folder.
  - *If the series folder contains season sub-folders, place the episode into the appropriate season sub-folder instead of the root.*
- **Source is an episode folder (single file inside)** -> move the folder as-is into the series folder.
  - *If the destination is multi-nested, the episode should be placed into the correct season sub-folder.*
- **Source is a season folder (contains multiple episode files)**
  - If `is_multi_nested(destination)` is True -> rename the season folder to match the destination's canonical pattern obtained via `season_folder_pattern()` and move it as a season sub-folder.
  - If `is_multi_flat(destination)` is True -> flatten the season folder and move all episode files directly into the series root.
  - If neither predicate is True -> abort the move and require user intervention, as the destination layout is ambiguous.
- **Source is a series folder (contains multiple season folders)** -> **merge (interleave)** the series folder into the destination series folder.
  *No deletion or replacement occurs; every existing episode is preserved and any duplicate episode is skipped.
  The incoming duplicate file is not moved, its source path is appended to `Download.skipped`, and the destination duplicate remains unchanged.*
- **Destination already contains a folder with the same name as the source**
  *If the folder already exists, the incoming folder is merged into it; no deletion or replacement occurs.*
- **Destination already contains an episode file with the same name**
  *The incoming file is skipped (no replacement). The source path of the skipped file is recorded in the `Download` class’s `skipped` list for later cleanup.*
- **Source contains non-video files** (e.g., `.txt`, `.jpg`) -> ignore them; only move files whose suffix matches `video_exts`.
- **Source contains hidden files** (e.g., `.DS_Store`) -> ignore them.
- **Source or destination paths contain spaces or special characters** -> handle them correctly by using `Path` objects.
- **Destination layout handling**
  - Use `is_multi_nested(destination)` to detect a season-structured series folder.
  - Use `is_multi_flat(destination)` to detect a flat series root with no season sub-folders.
  - The move behaviour for source episodes, season folders, or series folders should branch according to these predicates.
  - If neither predicate is True:
    - Attempt to **auto-resolve orphaned root episodes** by creating season sub-folders and moving episodes into them.
    - If the layout cannot be safely resolved automatically, abort the move and require user intervention.

## Special-Case: Flat-Root -> Structured-Root Conversion

When a **downloaded season folder** (e.g., `My Special Show - Season 02`) is moved into a series that currently stores only a **single-season flat root** (S01 files in the root):

1. **Rename the incoming season folder to match the destination’s canonical pattern obtained via `season_folder_pattern()` and move it into the series folder.**
2. **Create a proper season sub-folder** for the orphaned root S01 files.
   - The new folder name is derived from the destination’s canonical `season_folder_pattern()` (e.g., `Season 01` or `S01`).
3. **Flatten any remaining nested season structure** if the destination is flat; otherwise preserve the season hierarchy.

## Storage Analysis Helpers

`StorageTVSeriesStructureAnalysis` should expose the following helpers:

- **`is_multi_flat`**
  - `True` if **all episodes** are in the series root and **no season sub-folders exist**.
  - Works for **any number of seasons** (1 or more).

- **`is_multi_nested`**
  - `True` if **all episodes** are located inside their respective season-named sub-folders.
  - No episodes exist in the series root.

- **Invalid / Ambiguous Layout**
  - Any layout that is neither fully multi-flat nor fully multi-nested.
  - **Auto-resolution:** orphaned root episodes can be moved into season sub-folders to produce a valid multi-nested layout.
    - this falls under the clean up operation, not move_to, we note it here for reference and context bounds.
  - **Otherwise:** operation is aborted; user intervention is required.

- **Caller overrides** (`force_flat` / `force_structured`) – still honour these flags, but only when the current layout is deterministically flat or nested.
  - If the layout is invalid and cannot be resolved automatically, abort with a clear user-friendly message.

- **Rationale**
  - Keeps `move_to` simple and predictable.
  - Avoids accidental mixing of flat and nested episodes.
  - Clarifies when auto-conversion is safe vs. when manual intervention is required.

- **Implementation**
  - Add `is_multi_nested()` to `StorageTVSeriesStructureAnalysis`.
  - Update `effective_keep_flat()` to consider both predicates and raise an exception if neither is `True`.
  - Adjust tests to cover these scenarios.

## Cleanup Topic (TBC)

- The `Download` class will include a new member `skipped: list[str]` to store the full source paths of any skipped files during a `move_to` operation.
- Detailed cleanup logic (removing skipped files, finalizing downloads, etc.) will be documented in a separate cleanup-topic notes file.

## 10. LLM help notes

If you are a chatbot / llm, etc... please note this is instruction for you.

- Logical inconsistencies are to be resolved - logical issues are those which constitute an obstacle to correct test and code implementation.
- maintain formatting in general, and return as a markdown code block
- pathes are returned as a recreation of the notes with changes/fixes/resolutions nicluded
- ASCII only - no emojis or extended unicode
