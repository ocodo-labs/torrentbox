# TODOs for TorrentBox `move_to` implementation

- Add `is_S01_flat` property to `StorageTVSeriesStructureAnalysis`.
- Implement `force_flat` and `force_structured` overrides in `move_to`.
- Validate destination layout before any move; abort on ambiguous layouts.
- Implement flat-root -> structured-root conversion logic:
-  - Detect `Season 01 flat` and `Multi-flat` states.
-  - Create season sub-folders using `season_folder_pattern`.
-  - Move existing root episodes into the appropriate season folders.
- Ensure duplicate detection works for:
-  - Files with the same name in the destination.
-  - Folders with the same name (merge contents, skip duplicates).
- Record all skipped source paths in `self.skipped`.
- Add handling for episode folders (single‑episode directories):
-  - Move the folder as a unit.
-  - Merge with existing destination folder when name collides.
- Add handling for season folders:
-  - Rename to canonical name before moving.
-  - Merge with existing season folder if present.
- Add handling for series folders:
-  - Recursively merge contents.
-  - Skip duplicate files, record them.
-  - Ensure non-video files are ignored throughout all move operations.
-  - Add explicit checks to prevent creation of symlinks.
-  - Write unit tests covering:
  - All source types (episode file, episode folder, season folder, series folder).
-  - All destination states (Empty, Season 01 flat, Multi-flat, Multi-nested, Invalid).
  - Duplicate handling and `skipped` tracking.
-  - Force overrides (`force_flat`, `force_structured`).
-  - Flat-to-structured conversion scenarios.
- Update docstrings for `move_to` to reflect the rules from the notes.
- Add logging or verbose output for key decision points (optional but helpful for debugging).
- Review and refactor `StorageTVSeriesStructureAnalysis` helpers for clarity and performance.

## Missing tests to implement

### Source: **Single episode file**
- `test_move_single_episode_file_flat_destination`
  - Move a single episode file into an **empty** destination (should land in the root).
  - Move a single episode file into a **Season 01 flat** destination (should be placed in the root).
  - Move a single episode file into a **multi‑flat** destination (should be placed in the root).
  - Move a single episode file into a **multi‑nested** destination (should be placed inside the matching season sub‑folder).
  - Move a single episode file into an **invalid/ambiguous** destination (should raise `RuntimeError`).

### Source: **Episode folder** (contains exactly one video file)
- `test_move_episode_folder_flat_destination`
  - Destination empty, flat, multi-flat, multi-nested, invalid - same expectations as for a single file but the folder itself should be moved/merged.

### Source: **Season folder** (multiple episodes of the same season)
- `test_move_season_folder_into_flat_destination`
  - Destination empty -> season folder should be renamed to canonical name and placed as a sub-folder.
  - Destination **Season 01 flat** -> rename if needed and merge into existing season folder.
  - Destination **multi-flat** -> rename and add as a new season sub-folder.
  - Destination **multi-nested** -> rename and merge without duplication.
  - Destination **invalid/ambiguous** -> raise `RuntimeError`.

### Source: **Series folder** (episodes from multiple seasons)
- `test_merge_series_folder_with_duplicates`
  - Destination empty -> all episodes copied into appropriate layout (flat or nested based on destination).
  - Destination **Season 01 flat** -> episodes merged, duplicates skipped and recorded.
  - Destination **multi-flat** -> episodes merged into root, duplicates handled.
  - Destination **multi-nested** -> episodes placed into correct season sub-folders, duplicates skipped.
  - Destination **invalid/ambiguous** -> raise `RuntimeError`.

### Invalid / Edge Cases
- `test_move_ambiguous_destination_raises`
  - Verify that any move operation (file, folder, season, series) into a destination where videos exist both in the root and in season sub-folders for >= 2 seasons raises an exception.
- `test_force_flat_override`
  - Ensure `force_flat` option forces a flat layout even when destination is nested.
- `test_force_structured_override`
  - Ensure `force_structured` option forces a nested layout even when destination is flat.

## Todo dependencies

The following dependencies indicate which implementation steps or other tests must be completed before a given test can be meaningfully written/executed.

* **`test_move_single_episode_file_*`** - requires the core `move_to` logic for handling a single episode file and the destination layout detection (`effective_keep_flat`, `is_multi_flat`, `is_multi_nested`).
* **`test_move_episode_folder_flat_destination`** - depends on **`test_move_single_episode_file_*`** because the folder handling re-uses the single-file move logic after extracting the episode file.
* **`test_move_season_folder_into_*`** - depends on **`test_move_single_episode_file_*`** (for season detection and canonical naming) and on the implementation of the `force_flat` / `force_structured` overrides.
* **`test_merge_series_folder_with_duplicates`** - depends on **`test_move_episode_folder_flat_destination`** and **`test_move_season_folder_into_*`** as it merges multiple source types.
* **`test_move_ambiguous_destination_raises`** - depends on the destination-layout validation logic (`effective_keep_flat` raising on ambiguous layouts).
* **`test_force_flat_override`** and **`test_force_structured_override`** - depend on the implementation of the `force_flat` and `force_structured` parameters in `move_to` and on the layout detection helpers.

When working through the TODO list, ensure the dependent items are addressed in the order listed above.
