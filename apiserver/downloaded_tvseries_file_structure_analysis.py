import re
from pathlib import Path
from typing import List
import shutil
import os


class DownloadedTVSeriesStructureAnalysis:
    def __init__(self, filename: str, video_exts: List[str]):
        self.filename = filename
        self.video_exts = video_exts
        # List of source paths that were skipped because a duplicate existed
        self.skipped: List[str] = []

    def move_to(self, dest: Path) -> bool:
        """
        Move the analyzed file or folder to a new destination according to the
        Move-to Rules & Special-Case Handling notes.

        Parameters
        ----------
        dest : Path
            Destination *series* folder (e.g. /media/Shows/My Show).

        Returns
        -------
        bool
            True if the move succeeded, False otherwise.
        """
        # --------------------------------------------------------------------
        # 1. Ensure destination exists (create if necessary)
        # --------------------------------------------------------------------
        dest.mkdir(parents=True, exist_ok=True)

        src = Path(self.filename)
        if not src.exists():
            raise FileNotFoundError(f"Source {src} does not exist")

        # --------------------------------------------------------------------
        # 2. Analyse destination layout
        # --------------------------------------------------------------------
        dest_analysis = StorageTVSeriesStructureAnalysis(
            series=dest.name,
            media_root=str(dest.parent),
            video_exts=self.video_exts,
        )
        # Raise if layout is ambiguous
        dest_analysis.effective_keep_flat()  # may raise

        # --------------------------------------------------------------------
        # 3. Helper to move a single video file, handling duplicates
        # --------------------------------------------------------------------
        def _move_file(file_path: Path, target_dir: Path):
            target = target_dir / file_path.name
            if target.exists():
                # Duplicate – skip and record
                self.skipped.append(str(file_path))
                return False
            shutil.move(str(file_path), str(target))
            return True

        # --------------------------------------------------------------------
        # 4. Determine source type and apply rules
        # --------------------------------------------------------------------
        if self.is_episode_file:
            # Single episode file
            if dest_analysis.is_multi_nested:
                # Find matching season folder (or create it)
                season = self.extract_season_from_filename(src.name)
                season_dir = dest / dest_analysis.season_folder_pattern(season)
                season_dir.mkdir(parents=True, exist_ok=True)
                _move_file(src, season_dir)
            else:  # flat layout
                _move_file(src, dest)

        elif self.is_episode_folder:
            # Folder that contains exactly one episode file
            episode_file = next(
                f for f in Path(self.filename).iterdir()
                if f.is_file() and f.suffix.lstrip(".").lower() in self.video_exts
            )
            if dest_analysis.is_multi_nested:
                season = self.extract_season_from_filename(episode_file.name)
                season_dir = dest / dest_analysis.season_folder_pattern(season)
                season_dir.mkdir(parents=True, exist_ok=True)
                _move_file(episode_file, season_dir)
                # Move the now-empty folder (optional – keep it clean)
                try:
                    Path(self.filename).rmdir()
                except OSError:
                    pass
            else:
                _move_file(episode_file, dest)

        elif self.is_season_folder:
            # Source is a season folder (multiple episodes)
            if dest_analysis.is_multi_nested:
                # Rename to canonical pattern and move as a sub-folder
                season = self.extract_season_from_filename(
                    next(iter(Path(self.filename).glob("*"))).name
                )
                canonical_name = dest_analysis.season_folder_pattern(season)
                target_dir = dest / canonical_name
                target_dir.mkdir(parents=True, exist_ok=True)
                for item in Path(self.filename).iterdir():
                    if item.is_file() and item.suffix.lstrip(".").lower() in self.video_exts:
                        _move_file(item, target_dir)
                # Remove empty source folder
                try:
                    Path(self.filename).rmdir()
                except OSError:
                    pass
            elif dest_analysis.is_multi_flat:
                # Flatten: move all episodes directly into series root
                for item in Path(self.filename).iterdir():
                    if item.is_file() and item.suffix.lstrip(".").lower() in self.video_exts:
                        _move_file(item, dest)
                # Remove empty source folder
                try:
                    Path(self.filename).rmdir()
                except OSError:
                    pass
            else:
                raise RuntimeError(
                    "Destination layout ambiguous – cannot move season folder"
                )

        elif self.is_series_folder:
            # Source is a series folder – merge contents
            for root, _, files in os.walk(self.filename):
                for name in files:
                    file_path = Path(root) / name
                    if file_path.suffix.lstrip(".").lower() not in self.video_exts:
                        continue  # ignore non-video files
                    # Determine target location based on destination layout
                    if dest_analysis.is_multi_nested:
                        season = self.extract_season_from_filename(name)
                        season_dir = dest / dest_analysis.season_folder_pattern(season)
                        season_dir.mkdir(parents=True, exist_ok=True)
                        _move_file(file_path, season_dir)
                    else:  # flat
                        _move_file(file_path, dest)
            # Optionally clean up empty directories in source
            shutil.rmtree(self.filename, ignore_errors=True)

        else:
            raise RuntimeError("Source type not recognized for move operation")

        return True

    @property
    def is_episode_file(self) -> bool:
        """Check if the file is a valid episode file."""
        if not any(
            self.filename.lower().endswith(f".{ext}") for ext in self.video_exts
        ):
            return False
        return self.match_episode_pattern(self.filename)

    @property
    def is_episode_folder(self) -> bool:
        """Check if the folder contains a single episode file."""
        if not Path(self.filename).is_dir():
            return False
        folder_files = list(Path(self.filename).glob("*"))
        video_files = [
            f
            for f in folder_files
            if any(f.name.lower().endswith(f".{ext}") for ext in self.video_exts)
        ]
        return len(video_files) == 1 and self.match_episode_pattern(video_files[0].name)

    @property
    def is_season_folder(self) -> bool:
        """Check if the folder contains valid episode files and belongs to the same season."""
        if not Path(self.filename).is_dir():
            return False
        folder_files = list(Path(self.filename).glob("**/*"))
        video_files = [
            f
            for f in folder_files
            if any(f.name.lower().endswith(f".{ext}") for ext in self.video_exts)
        ]

        if len(video_files) < 2:  # A season must have at least 2 episodes
            return False

        season_number = self.extract_season_from_filename(video_files[0].name)

        # Check if all episodes in the folder belong to the same season
        for video in video_files:
            extracted_season = self.extract_season_from_filename(video.name)
            if extracted_season != season_number:
                return False

        return True

    @property
    def is_series_folder(self) -> bool:
        """Check if the folder contains episodes from multiple seasons."""
        if not Path(self.filename).is_dir():
            return False

        folder_files = list(Path(self.filename).glob("**/*"))
        video_files = [
            f
            for f in folder_files
            if any(f.name.lower().endswith(f".{ext}") for ext in self.video_exts)
        ]

        if len(video_files) < 2:  # A series folder should have at least two episodes
            return False

        # Get unique season numbers from the files in the folder
        season_numbers = {
            self.extract_season_from_filename(f.name) for f in video_files
        }

        # Return True if there are episodes from multiple seasons
        return len(season_numbers) > 1

    def match_episode_pattern(self, filename: str) -> bool:
        """Match the episode filename pattern (e.g., 'S01E03')."""
        episode_pattern = r"^S\d{2}E\d{2}"
        return bool(re.match(episode_pattern, filename, re.IGNORECASE))

    def extract_season_from_filename(self, filename: str) -> str:
        """Extract the season number from the filename (e.g., 'S02')."""
        match = re.match(r"^(S\d{2})E\d{2}", filename, re.IGNORECASE)
        if match:
            return match.group(1)  # We return just the 'S01', 'S02' part
        return ""


class StorageTVSeriesStructureAnalysis:
    def __init__(self, series: str, media_root: str, video_exts: List[str]):
        self.series = series
        self.media_root = Path(media_root)
        self.series_path = self.media_root / self.series
        self.video_exts = video_exts

    # --------------------------------------------------------------------
    # Helper: collect distinct season tokens (e.g. "S01", "S02") found in
    # the whole series tree.
    # --------------------------------------------------------------------
    def _season_tokens(self) -> set[str]:
        tokens = set()
        for ep in self.series_episodes:
            m = re.match(r"^(S\d{2})E\d{2}", ep.name, re.IGNORECASE)
            if m:
                tokens.add(m.group(1).upper())
        return tokens

    @property
    def is_series(self):
        return self.series_path.exists() and self.series_path.is_dir()

    @property
    def series_episodes(self):
        folder_files = list(self.series_path.glob("**/*"))
        video_files = [
            f
            for f in folder_files
            if any(f.name.lower().endswith(f".{ext}") for ext in self.video_exts)
        ]
        return video_files

    @property
    def season_folders(self):
        episodes = self.series_episodes
        season_dirs = {ep.parent for ep in episodes}
        return list(sorted(season_dirs))

    # --------------------------------------------------------------------
    # New layout helpers (as per the notes)
    # --------------------------------------------------------------------
    @property
    def is_multi_flat(self) -> bool:
        """
        True if *all* video files are directly in the series root and
        no season sub‑folders exist.
        Returns False when the series contains ≤ 1 distinct season
        (because the “multi‑flat” concept only matters for multiple seasons).
        """
        if not self.is_series:
            return False

        # If there is 0 or 1 season, we treat the layout as flat
        if len(self._season_tokens()) <= 1:
            # Still need to ensure there are no season sub‑folders that contain videos
            for sub in self.series_path.iterdir():
                if sub.is_dir():
                    if any(
                        f.is_file()
                        and f.suffix.lstrip(".").lower() in self.video_exts
                        for f in sub.rglob("*")
                    ):
                        return False
            return True

        # ----- multiple seasons present – evaluate true multi‑flat -----
        # No sub‑folder may contain a video
        for sub in self.series_path.iterdir():
            if sub.is_dir():
                if any(
                    f.is_file()
                    and f.suffix.lstrip(".").lower() in self.video_exts
                    for f in sub.rglob("*")
                ):
                    return False

        # At least one video must exist in the root
        return any(
            f.is_file()
            and f.suffix.lstrip(".").lower() in self.video_exts
            for f in self.series_path.iterdir()
        )

    @property
    def is_multi_nested(self) -> bool:
        """
        True if *all* video files are inside season‑named sub‑folders and
        none exist in the series root.
        Returns False when the series contains ≤ 1 distinct season
        (the “multi‑nested” concept only matters for multiple seasons).
        """
        if not self.is_series:
            return False

        # If there is 0 or 1 season, treat as not‑multi‑nested
        if len(self._season_tokens()) <= 1:
            return False

        # No video files directly in the root
        if any(
            f.is_file()
            and f.suffix.lstrip(".").lower() in self.video_exts
            for f in self.series_path.iterdir()
        ):
            return False

        # At least one season folder must exist with videos
        season_dirs = [
            d
            for d in self.series_path.iterdir()
            if d.is_dir()
            and any(
                f.is_file()
                and f.suffix.lstrip(".").lower() in self.video_exts
                for f in d.iterdir()
            )
        ]
        return len(season_dirs) > 0

    def season_folder_pattern(self, season_token: str) -> str:
        """
        Return the canonical season folder name for a given season token
        (e.g., ``season_token='S02'`` -> ``'Season 02'``).
        Adjust the format here if your library uses a different convention.
        """
        # Strip leading 'S' and keep the two-digit number
        number = season_token.lstrip("S")
        return f"Season {number}"

    def effective_keep_flat(self):
        """
        Validate the current layout.
        Returns True if the layout is flat, False if nested.
        Raises RuntimeError only when the layout is truly ambiguous
        (mixed root + sub‑folder videos *and* more than one season present).
        """
        if self.is_multi_flat:
            return True
        if self.is_multi_nested:
            return False

        # If we reach here we have either:
        #   * 0 videos (empty folder) → treat as flat
        #   * ≤ 1 season → treat as flat
        if not self.series_episodes or len(self._season_tokens()) <= 1:
            return True

        raise RuntimeError(
            f"Series '{self.series}' has an ambiguous layout – "
            "neither fully flat nor fully nested."
        )
