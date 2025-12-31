import re
from pathlib import Path
from typing import List

class TVSeriesStructureAnalysis:
    def __init__(self, filename: str, video_exts: List[str]):
        self.filename = filename  # The filename or folder path
        self.video_exts = video_exts  # List of valid video extensions (e.g., ["mkv", "mp4", "avi"])

    @property
    def is_episode_file(self) -> bool:
        """Check if the file is a valid episode file."""
        if not any(self.filename.endswith(f".{ext}") for ext in self.video_exts):
            return False
        return self.match_episode_pattern(self.filename)

    @property
    def is_episode_folder(self) -> bool:
        """Check if the folder contains a single episode file."""
        if not Path(self.filename).is_dir():
            return False
        folder_files = list(Path(self.filename).glob("*"))
        video_files = [f for f in folder_files if any(f.name.endswith(f".{ext}") for ext in self.video_exts)]
        return len(video_files) == 1 and self.match_episode_pattern(video_files[0].name)

    @property
    def is_season_folder(self) -> bool:
        """Check if the folder contains valid episode files and belongs to the same season."""
        if not Path(self.filename).is_dir():
            return False
        folder_files = list(Path(self.filename).glob("**/*"))  # Glob all files recursively
        video_files = [f for f in folder_files if any(f.name.endswith(f".{ext}") for ext in self.video_exts)]

        if len(video_files) < 2:  # A season must have at least 2 episodes
            return False

        # Ensure all video files have the same season number
        season_number = self.extract_season_from_filename(video_files[0].name)
        return len(video_files) > 1 and all(self.extract_season_from_filename(f.name) == season_number for f in video_files)

    @property
    def is_series_folder(self) -> bool:
        """Check if the folder contains episodes from multiple seasons."""
        if not Path(self.filename).is_dir():
            return False
        folder_files = list(Path(self.filename).glob("**/*"))
        video_files = [f for f in folder_files if any(f.name.endswith(f".{ext}") for ext in self.video_exts)]

        if len(video_files) < 2:
            return False

        season_numbers = {self.extract_season_from_filename(f.name) for f in video_files}
        return len(season_numbers) > 1

    def match_episode_pattern(self, filename: str) -> bool:
        """Match the episode filename pattern (e.g., 'S02E04')."""
        episode_pattern = r"^S\d{2}E\d{2}"
        return bool(re.match(episode_pattern, filename))

    def extract_season_from_filename(self, filename: str) -> str:
        """Extract the season number from the filename (e.g., 'S02')."""
        match = re.match(r"^S(\d{2})", filename)
        if match:
            return match.group(0)  # Return 'S02' from 'S02E04'
        return ""
