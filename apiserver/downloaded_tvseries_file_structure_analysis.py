import re
from pathlib import Path
from typing import List


class DownloadedTVSeriesStructureAnalysis:
    def __init__(self, filename: str, video_exts: List[str]):
        self.filename = filename
        self.video_exts = (video_exts)

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
        folder_files = list(
            Path(self.filename).glob("**/*")
        )  # Glob all files recursively
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
        self.series_path =  Path(media_root, self.series)
        self.video_exts = (video_exts)

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
