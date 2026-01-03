import pytest
from pathlib import Path
from tempfile import TemporaryDirectory
from downloaded_tvseries_file_structure_analysis import DownloadedTVSeriesStructureAnalysis

def test_is_episode_file():
    valid_files = [
        "S01E01.mkv",
        "s01e02.mp4",
        "s03E05.avi",
        "S10E10.mkv"
    ]
    invalid_files = [
        "Episode01.mkv",
        "S01E01.txt",
        "S02E05.jpg",
        "randomfile.mp4"
    ]

    for filename in valid_files:
        ts = DownloadedTVSeriesStructureAnalysis(filename, video_exts=["mkv", "mp4", "avi"])
        assert ts.is_episode_file == True

    for filename in invalid_files:
        ts = DownloadedTVSeriesStructureAnalysis(filename, video_exts=["mkv", "mp4", "avi"])
        assert ts.is_episode_file == False


def test_is_episode_folder():
    with TemporaryDirectory() as temp_dir:
        # Test single valid episode file in folder
        valid_file = Path(temp_dir) / "S01E01.mkv"
        valid_file.touch()

        ts = DownloadedTVSeriesStructureAnalysis(str(temp_dir), video_exts=["mkv", "mp4", "avi"])
        assert ts.is_episode_folder == True

        # Test invalid episode file in folder (e.g., more than one video file)
        invalid_file1 = Path(temp_dir) / "S01E02.mkv"
        invalid_file1.touch()

        ts = DownloadedTVSeriesStructureAnalysis(str(temp_dir), video_exts=["mkv", "mp4", "avi"])
        assert ts.is_episode_folder == False


def test_is_season_folder():
    with TemporaryDirectory() as temp_dir:
        # Test season folder with valid episodes
        valid_file1 = Path(temp_dir) / "S01E01.mkv"
        valid_file1.touch()
        valid_file2 = Path(temp_dir) / "S01E02.mkv"
        valid_file2.touch()

        ts = DownloadedTVSeriesStructureAnalysis(str(temp_dir), video_exts=["mkv", "mp4", "avi"])
        assert ts.is_season_folder == True

        # Test season folder with episodes from different seasons
        valid_file3 = Path(temp_dir) / "S02E01.mkv"
        valid_file3.touch()

        ts = DownloadedTVSeriesStructureAnalysis(str(temp_dir), video_exts=["mkv", "mp4", "avi"])
        assert ts.is_season_folder == False


def test_is_series_folder():
    with TemporaryDirectory() as temp_dir:
        # Test series folder with episodes from different seasons
        valid_file1 = Path(temp_dir) / "S01E01.mkv"
        valid_file1.touch()
        valid_file2 = Path(temp_dir) / "S02E01.mkv"
        valid_file2.touch()

        ts = DownloadedTVSeriesStructureAnalysis(str(temp_dir), video_exts=["mkv", "mp4", "avi"])
        assert ts.is_series_folder == True
