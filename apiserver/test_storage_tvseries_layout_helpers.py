from pathlib import Path
from tempfile import TemporaryDirectory

from downloaded_tvseries_file_structure_analysis import StorageTVSeriesStructureAnalysis


def test_empty_series_is_flat():
    """
    An empty series folder should be considered a valid flat layout.
    ``effective_keep_flat`` must return ``True`` and ``is_multi_flat`` should be ``True``.
    """
    with TemporaryDirectory() as tmp:
        media_root = Path(tmp)
        series_name = "EmptySeries"
        (media_root / series_name).mkdir()
        sa = StorageTVSeriesStructureAnalysis(series_name, str(media_root), video_exts=["mkv"])
        assert sa.is_multi_flat is True
        assert sa.is_multi_nested is False
        assert sa.effective_keep_flat() is True


def test_single_season_flat_layout():
    """
    All episodes of a single season are stored directly in the series root.
    The layout must be reported as flat (multi‑flat) and not nested.
    """
    with TemporaryDirectory() as tmp:
        media_root = Path(tmp)
        series = "SingleSeasonFlat"
        series_path = media_root / series
        series_path.mkdir()
        # create two episodes for season 01 directly in the root
        (series_path / "S01E01.mkv").touch()
        (series_path / "S01E02.mkv").touch()
        sa = StorageTVSeriesStructureAnalysis(series, str(media_root), video_exts=["mkv"])
        assert sa.is_multi_flat is True
        assert sa.is_multi_nested is False
        assert sa.effective_keep_flat() is True


def test_single_season_nested_layout():
    """
    All episodes of a single season are stored inside a season sub‑folder.
    The layout must be reported as nested (multi‑nested) and not flat.
    """
    with TemporaryDirectory() as tmp:
        media_root = Path(tmp)
        series = "SingleSeasonNested"
        series_path = media_root / series
        series_path.mkdir()
        season_dir = series_path / "Season01"
        season_dir.mkdir()
        (season_dir / "S01E01.mkv").touch()
        (season_dir / "S01E02.mkv").touch()
        sa = StorageTVSeriesStructureAnalysis(series, str(media_root), video_exts=["mkv"])
        assert sa.is_multi_flat is False
        assert sa.is_multi_nested is True
        assert sa.effective_keep_flat() is False


def test_multi_season_flat_layout():
    """
    Episodes from multiple seasons are all stored directly in the series root.
    The layout should be recognised as multi‑flat.
    """
    with TemporaryDirectory() as tmp:
        media_root = Path(tmp)
        series = "MultiSeasonFlat"
        series_path = media_root / series
        series_path.mkdir()
        (series_path / "S01E01.mkv").touch()
        (series_path / "S02E01.mkv").touch()
        (series_path / "S02E02.mkv").touch()
        sa = StorageTVSeriesStructureAnalysis(series, str(media_root), video_exts=["mkv"])
        assert sa.is_multi_flat is True
        assert sa.is_multi_nested is False
        assert sa.effective_keep_flat() is True


def test_multi_season_nested_layout():
    """
    Episodes from multiple seasons are each stored in their own season sub‑folder.
    The layout should be recognised as multi‑nested.
    """
    with TemporaryDirectory() as tmp:
        media_root = Path(tmp)
        series = "MultiSeasonNested"
        series_path = media_root / series
        series_path.mkdir()
        season1 = series_path / "Season01"
        season2 = series_path / "Season02"
        season1.mkdir()
        season2.mkdir()
        (season1 / "S01E01.mkv").touch()
        (season2 / "S02E01.mkv").touch()
        (season2 / "S02E02.mkv").touch()
        sa = StorageTVSeriesStructureAnalysis(series, str(media_root), video_exts=["mkv"])
        assert sa.is_multi_flat is False
        assert sa.is_multi_nested is True
        assert sa.effective_keep_flat() is False


def test_ambiguous_mixed_layout_raises():
    """
    When videos exist both in the root and inside season sub‑folders
    (and there are ≥ 2 seasons), ``effective_keep_flat`` must raise.
    """
    with TemporaryDirectory() as tmp:
        media_root = Path(tmp)
        series = "AmbiguousSeries"
        series_path = media_root / series
        series_path.mkdir()
        # root video (season 01)
        (series_path / "S01E01.mkv").touch()
        # season sub‑folder with another season
        season2 = series_path / "Season02"
        season2.mkdir()
        (season2 / "S02E01.mkv").touch()
        sa = StorageTVSeriesStructureAnalysis(series, str(media_root), video_exts=["mkv"])
        try:
            sa.effective_keep_flat()
        except RuntimeError:
            pass
        else:
            raise AssertionError("expected RuntimeError for ambiguous layout")


def test_season_folder_pattern():
    """
    Verify that the canonical season folder name is generated correctly.
    """
    with TemporaryDirectory() as tmp:
        media_root = Path(tmp)
        series = "AnySeries"
        (media_root / series).mkdir()
        sa = StorageTVSeriesStructureAnalysis(series, str(media_root), video_exts=["mkv"])
        assert sa.season_folder_pattern("S01") == "Season 01"
        assert sa.season_folder_pattern("S12") == "Season 12"
