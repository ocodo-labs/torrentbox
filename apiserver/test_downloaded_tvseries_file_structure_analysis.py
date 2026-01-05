from pathlib import Path
from tempfile import TemporaryDirectory

from downloaded_tvseries_file_structure_analysis import DownloadedTVSeriesStructureAnalysis, StorageTVSeriesStructureAnalysis


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


def test_move_file_in_folder_to_dest():
    """
    Test that the `move_to` method correctly relocates a file or folder.
    """
    with TemporaryDirectory() as src_dir, TemporaryDirectory() as dst_dir:
        # Create a sample episode file in the source directory
        src_file = Path(src_dir, "S01E01.mkv")
        src_file.touch()

        # Instantiate the analyzer and perform the move
        ts = DownloadedTVSeriesStructureAnalysis(str(src_dir), video_exts=["mkv", "mp4", "avi"])
        ts.move_to(Path(dst_dir))

        # Verify the file has been moved
        moved_file = Path(dst_dir) / "S01E01.mkv"
        assert moved_file.exists(), "File was not moved to the destination."
        assert not src_file.exists(), "Source file still exists after move."

def test_move_single_episode_file_flat_destination():
    """
    Move a single episode file into an empty (flat) destination series folder.
    The file should end up directly in the destination root.
    """
    pass  # TODO: create src file, empty dst, call move_to, assert location


def test_move_single_episode_file_nested_destination():
    """
    Move a single episode file into a destination that already has a season sub‑folder.
    The file must be placed inside the matching season sub‑folder.
    """
    pass  # TODO: set up destination with Season01 folder, move S01E03, assert inside Season01


def test_move_episode_folder():
    """
    Source is a folder that contains exactly one video file.
    The video should be moved according to the destination layout (flat or nested).
    """
    pass  # TODO: create folder with S02E01.mkv, move into flat and nested destinations


def test_move_season_folder_into_flat_destination():
    """
    A season folder (multiple episodes) is moved into a destination that is flat.
    The season folder should be renamed to the canonical pattern and placed
    as a sub‑folder inside the destination.
    """
    pass  # TODO: create src Season02 folder, empty dst, move, assert Season 02 exists with files


def test_move_season_folder_into_nested_destination():
    """
    A season folder is moved into a destination that already uses a nested layout.
    The folder should be renamed to the canonical pattern and merged without
    overwriting existing episodes.
    """
    pass  # TODO: set up dst with Season01, move Season02 folder, check both exist


def test_merge_series_folder_with_duplicates():
    """
    Source is a series folder containing episodes from multiple seasons.
    Destination already contains some of those episodes.
    Duplicate episodes must be skipped and their source paths recorded in
    ``DownloadedTVSeriesStructureAnalysis.skipped``.
    """
    pass  # TODO: create src with S01E01, S02E01; dst already has S01E01; move; assert skip list contains src path


def test_move_ambiguous_destination_raises():
    """
    Destination layout is ambiguous (mixed root and sub‑folder videos with ≥2 seasons).
    ``move_to`` should raise ``RuntimeError``.
    """
    pass  # TODO: build ambiguous dst, attempt move, expect exception
