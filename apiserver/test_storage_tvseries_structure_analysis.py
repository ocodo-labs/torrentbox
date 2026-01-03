from pathlib import Path
from tempfile import TemporaryDirectory
from downloaded_tvseries_file_structure_analysis import StorageTVSeriesStructureAnalysis

def test_is_series():
    with TemporaryDirectory() as temp_dir:
        media_root = Path(temp_dir)
        series_name = "MySeries"
        series_path = media_root / series_name
        series_path.mkdir()

        # Series folder exists
        ts = StorageTVSeriesStructureAnalysis(series_name, str(media_root), video_exts=["mkv"])
        assert ts.is_series is True

        # Series folder missing
        ts_missing = StorageTVSeriesStructureAnalysis("MissingSeries", str(media_root), video_exts=["mkv"])
        assert ts_missing.is_series is False

def test_series_episodes():
    with TemporaryDirectory() as temp_dir:
        media_root = Path(temp_dir)
        series_name = "MySeries"
        series_path = media_root / series_name
        series_path.mkdir()

        # Create two seasons with one episode each
        season1 = series_path / "Season01"
        season1.mkdir()
        (season1 / "S01E01.mkv").touch()

        season2 = series_path / "Season02"
        season2.mkdir()
        (season2 / "S02E01.mkv").touch()

        ts = StorageTVSeriesStructureAnalysis(series_name, str(media_root), video_exts=["mkv"])
        episodes = ts.series_episodes
        # Expect two episode files
        assert len(episodes) == 2
        assert any(ep.name == "S01E01.mkv" for ep in episodes)
        assert any(ep.name == "S02E01.mkv" for ep in episodes)

def test_season_folders():
    with TemporaryDirectory() as temp_dir:
        media_root = Path(temp_dir)
        series_name = "MySeries"
        series_path = media_root / series_name
        series_path.mkdir()

        # Create seasons with episodes
        for i in range(1, 4):
            season = series_path / f"Season{i:02d}"
            season.mkdir()
            (season / f"S0{i}E01.mkv").touch()

        ts = StorageTVSeriesStructureAnalysis(series_name, str(media_root), video_exts=["mkv"])
        seasons = ts.season_folders
        # Expect three sorted season directories
        assert len(seasons) == 3
        assert seasons[0].name == "Season01"
        assert seasons[1].name == "Season02"
        assert seasons[2].name == "Season03"

def test_s00_folders():
    with TemporaryDirectory() as temp_dir:
        media_root = Path(temp_dir)
        series_name = "MyOtherSeries"
        series_path = media_root / series_name
        series_path.mkdir()

        # Create seasons with episodes
        for i in range(1, 4):
            season = series_path / f"S{i:02d}"
            season.mkdir()
            (season / f"S0{i}E01.mkv").touch()

        ts = StorageTVSeriesStructureAnalysis(series_name, str(media_root), video_exts=["mkv"])
        seasons = ts.season_folders
        # Expect three sorted season directories
        assert len(seasons) == 3
        assert seasons[0].name == "S01"
        assert seasons[1].name == "S02"
        assert seasons[2].name == "S03"
