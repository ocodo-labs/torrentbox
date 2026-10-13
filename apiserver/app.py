import os
import subprocess
import shutil
from pathlib import Path
import re
import sys
import logging
import requests
import random
from fastapi import FastAPI, Request, APIRouter, HTTPException, Query
from pydantic import BaseModel
from pydantic.dataclasses import dataclass
from typing import Optional, List
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from omegaconf import OmegaConf
from omegaconf.errors import OmegaConfBaseException
from starlette.middleware.cors import CORSMiddleware
from bs4 import BeautifulSoup
from transmission_rpc import Client as Transmission
from redis import Redis
from ruamel.yaml import YAML
import io

"""
I was one of those people who luckily was
able to obtain a copy of The Mechanical Bride, early on.
You know that he had to pull off the shelves
- do you know this book at all?

He reproduced a lot of ads, from soap companies
and cigarette companies and everything. He showed
the actual ad, and then he would do an analysis of
them. And it is very funny.

But the companies whose ads they were took exception.
Copyright issues. And he had to pull the book.
But he had them in his cellar and if you had contact
you could purchase one out of the back window
of Marshall McLuhan's house - so The Mechanical Bride,
a piece of genius.

- Margret Attwood

"""


class QueryIn(BaseModel):
    query: Optional[str] = None


class MagnetActionIn(BaseModel):
    magnet_url: str


class TorrentRenameIn(BaseModel):
    torrent_id: Optional[str] = None
    filename: str
    newname: str


class RenameEntry(BaseModel):
    filename: str
    newname: str


class TorrentFilesRenameIn(BaseModel):
    torrent_id: str
    renames: List[RenameEntry]


class DownloadedFileRenameIn(BaseModel):
    filename: str
    newname: str


class TorrentActionIn(BaseModel):
    torrent_id: str


class TorrentCleanupIn(BaseModel):
    torrent_id: str
    name: str
    files: List[str]


class FilenameIn(BaseModel):
    filename: str


class Top100Link(BaseModel):
    href: str


@dataclass
class ConfigMedia:
    directory: str
    wrap: Optional[bool]
    exts: List[str]


@dataclass
class ConfigMediaSettings:
    audiobooks: ConfigMedia
    books: ConfigMedia
    movies: ConfigMedia
    music: ConfigMedia
    software: ConfigMedia
    tvshows: ConfigMedia


@dataclass
class ConfigTransmissionSettings:
    port: int
    host: str


@dataclass
class ConfigFiltersSettings:
    words: List[str]


@dataclass
class ExternalLink:
    name: str
    href: str


@dataclass
class ConfigModel:
    mounts: List[str]
    downloads: str
    external_links: List[ExternalLink]
    media: ConfigMediaSettings
    transmission: ConfigTransmissionSettings
    valid_extensions: List[str]
    filters: ConfigFiltersSettings
    images: str


redis = Redis(decode_responses=True)
loadable_images = (".png", ".jpg", ".jpeg", ".gif", ".webp")


async def invalidate_cache(namespace: str):
    for key in await redis.keys(f"{namespace}*"):
        redis.delete(key)


app = FastAPI(
    title="torrentbox",
    version="1.1.0",
    docs_url=None,
    redoc_url=None,
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

api = APIRouter()

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

try:
    config_path = Path(__file__).parent / "config.yaml"
    raw_config = OmegaConf.load(config_path)
    config = OmegaConf.merge(OmegaConf.structured(ConfigModel), raw_config)
except OmegaConfBaseException as e:
    print(f"CONFIG INVALID: {e}")
    sys.exit(1)


def config_to_yaml(config):
    # OmegaConf to_yaml is subpar use ruamel.yaml
    data = OmegaConf.to_container(config)
    yaml = YAML()
    yaml.indent(sequence=4, offset=2)
    stream = io.StringIO()
    yaml.dump(data, stream)  # smfh
    return stream.getvalue()


def save_config(config):
    data = OmegaConf.to_container(config)
    yaml = YAML()
    yaml.indent(sequence=4, offset=2)
    try:
        config_path.write_text(yaml.dump(data, config_path))
        return True
    except Exception:
        return False


print(config_to_yaml(config))

def filter_words(word_list):
    filter_words = [word.lower() for word in config.filters.words]
    return [word for word in word_list if word.lower() not in filter_words]


def preprocess_title(title: str) -> set:
    title = os.path.splitext(title)[0]
    title = re.sub(r"['\"]", "", title)
    title = re.sub(r"[._+-]", " ", title)
    words = [word for word in title.split() if word.isalnum()]
    words = filter_words(words)
    return set(words)

def ordered_intersection(list1, list2):
    return [word for word in list1 if word in list2]

def get_matches_from(
    directory: str, torrent_name: str, valid_exts: List[str]
) -> List[str]:
    torrent_name_words = preprocess_title(torrent_name)
    matches = []
    for dirpath, _, files in os.walk(directory):
        for file_name in files:
            file_path = os.path.join(dirpath, file_name)
            file_ext = os.path.splitext(file_name)[1][1:].lower()
            if file_ext not in valid_exts:
                continue
            file_name_words = preprocess_title(file_name)

            # Word counts have to match
            if len(file_name_words) != len(torrent_name_words):
                continue

            intersection_words = ordered_intersection(
                file_name_words, torrent_name_words
            )
            if intersection_words == file_name_words:
                matches.append(file_path)

    return matches


def torrent_download_path(filename):
    return os.path.join(config.downloads, filename)


def download_torrent_files_move_to(filename, destination, media, headers=None):
    path = Path(torrent_download_path(filename))

    if not path.exists():
        raise HTTPException(404, f"{filename} not found")

    dest = Path(destination)

    if headers:
        tv_series_name = headers.get("X-TVSeries")
        tv_series_path = headers.get("X-TVSeriesPath")
        tv_series_new = headers.get("X-TVSeriesNew")

        if tv_series_name:
            tv_series_path = headers.get("X-TVSeriesPath")
            if tv_series_path:
                if tv_series_new and tv_series_new == "true":
                    logger.info(
                        f"TODO: TV Series video(s) move to tv series: {tv_series_name} - {filename} to {destination} - in {tv_series_path}"
                    )
                    try:
                        Path(dest, tv_series_path).mkdir()
                    except OSError:
                        raise HTTPException(
                            500,
                            f"Cannot create path: {str(Path(dest, tv_series_path))}",
                        )
                else:
                    logger.info(
                        f"TODO: TV Series video(s) move to tv series: {tv_series_name} - {filename} to {destination} - in {tv_series_path}"
                    )
                    # check exists or raise 404
                    if not Path(dest, tv_series_path).exists():
                        raise HTTPException(
                            404, f"No existing TV Series path: '{tv_series_path}'"
                        )

                shutil.move(str(path), Path(dest, tv_series_path))
                return {
                    "info": f"Moved {filename} to {tv_series_path} in {destination}"
                }
            else:
                error_msg = (
                    f"TV Series without mandatory series path - {tv_series_name}"
                )
                logger.error(error_msg)
                raise HTTPException(500, error_msg)

    try:
        if media == "movies":
            # File: wrap movie video files in a folder
            # only if explicitly configured
            if config.media[media].get("wrap"):
                target_folder = dest / path.stem
                target_folder.mkdir(parents=True, exist_ok=True)
                shutil.move(str(path), str(target_folder))
                return {"info": f"Wrapped + moved {filename} to {target_folder}"}

        # Directory: move as-is
        if path.is_dir():
            shutil.move(str(path), str(dest))
            return {"info": f"Moved folder {filename} to {destination}"}

        # Default: move file directly
        shutil.move(str(path), str(dest))
        return {"info": f"Moved {filename} to {destination}"}

    except Exception as e:
        raise HTTPException(500, str(e))


def torrent_file_rename(torrent_id, filename, newname):
    result = None

    try:
        transmission = Transmission(host=config.transmission.host)
        newname = Path(newname).name

        logger.info(
            f'Torrent file rename (id: "{torrent_id}" filename: "{filename}" newname: "{newname}" )'
        )

        result = transmission.rename_torrent_path(
            torrent_id=torrent_id, location=filename, name=newname
        )

        return result
    except Exception:
        raise HTTPException(
            500, f"Internal error renaming torrent {filename} to {newname}"
        )


def get_video_title(filename: str):
    """Return the current title of a video (MKV or MP4)."""
    if filename.endswith(".mkv"):
        result = subprocess.run(
            ["mkvpropedit", "--query", filename],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            logger.info(f"Failed to get MKV title: {result.stderr}")
            return None
        for line in result.stdout.splitlines():
            if line.startswith("Title:"):
                return line.split(":", 1)[1].strip()
        return None

    elif filename.endswith(".mp4"):
        result = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format_tags=title",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                filename,
            ],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            logger.info(f"Failed to get MP4 title: {result.stderr}")
            return None
        return result.stdout.strip() or None

    else:
        raise ValueError(f"Unsupported file type: {filename}")


def set_video_title(filename: str, title: str = ""):
    """
    Retitle video (mp4 or mkv) using the filename stem
    (filename minus extension), or use the given title.
    """
    path = Path(filename)
    logger.info(f"Setting Title for {path}")

    if not path.exists():
        raise FileNotFoundError(f"File not found: {filename}")

    if not title:
        title = path.stem.replace(".", " ").replace("_", " ")

    current_title = get_video_title(filename)
    logger.info(f"Current title: {current_title}")

    if current_title == title:
        logger.info("Title already set correctly, skipping update.")
        return title

    if filename.endswith(".mkv"):
        result = subprocess.run(
            ["mkvpropedit", filename, "--edit", "info", "--set", f"title={title}"],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            message = f"Failed to set MKV title: {result.stderr}"
            logger.info(message)
            raise RuntimeError(message)

    elif filename.endswith(".mp4"):
        temp_file = filename.replace(".mp4", "_titled.mp4")
        result = subprocess.run(
            [
                "ffmpeg",
                "-i",
                filename,
                "-metadata",
                f"title={title}",
                "-codec",
                "copy",
                temp_file,
            ],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            raise RuntimeError(f"Failed to set MP4 title: {result.stderr}")

        Path(temp_file).replace(filename)

    return title


def torrent_video_files(torrent_id):
    try:
        transmission = Transmission(host=config.transmission.host)
        torrent = transmission.get_torrent(torrent_id=torrent_id)

        files = torrent.get_files()
        logger.info(f"Files from {torrent_id}")
        logger.info(files)
        video_extensions = list(
            set(config.media.movies.exts + config.media.tvshows.exts)
        )
        logger.info("Video extensions from config movies and tvshows")
        logger.info(video_extensions)
        video_files = [
            Path(config.downloads) / file.name
            for file in files
            if any(file.name.lower().endswith(ext.lower()) for ext in video_extensions)
        ]
        logger.info(f"Getting video files for {torrent_id}")
        return video_files
    except Exception:
        return []


def downloaded_file_rename(filename, newname, overwrite=False):
    filename_path = os.path.join(config.downloads, filename)
    newname_path = os.path.join(config.downloads, newname)
    if os.path.exists(filename_path):
        if os.path.exists(newname_path) and overwrite is False:
            raise HTTPException(400, f"{newname} at {newname_path} already exists")
        else:
            os.rename(filename_path, newname_path)
            return {"info", "ok"}
    else:
        raise HTTPException(404, f"{filename} not found")


def remove_torrent(torrent_id, delete=False):
    transmission = Transmission(host=config.transmission.host)
    torrent = transmission.get_torrent(torrent_id)
    transmission.remove_torrent([torrent_id], delete_data=delete)
    return torrent


def check_existing_media(torrents_data):
    for torrent in torrents_data:
        torrent_name = torrent["name"]
        torrent["existing"] = []
        directory = config.media.movies.directory
        valid_exts = config.media.movies.exts
        matches = get_matches_from(directory, torrent_name, valid_exts)
        if matches:
            torrent["existing"] = matches
    return torrents_data


def scrape_poster_top_result(html):
    """Extract poster link from Rotten Tomatoes search results html."""
    if not html or not html.strip():
        return None

    try:
        soup = BeautifulSoup(html, "html.parser")
        result = soup.select_one("search-page-media-row img")

        if result and result.get("src"):
            return result.get("src")

        return None

    except Exception:
        return None


def scrape_torrent_links(html):
    """Extract names and torrent links from html."""
    if not html or not html.strip():
        return []

    try:
        soup = BeautifulSoup(html, "html.parser")
        links = soup.select('a[href*="/torrent/"]')

        data = []
        for link in links:
            name = link.text.strip() if link.text else ""
            href = link.get("href", "")

            if name and href:
                data.append({"name": name, "href": href})

        return data

    except Exception:
        return []


def scrape_tpb_rows(row):
    name = row.select_one('a[href^="https://tpb.party/torrent/"]')
    category = row.select_one('a[href^="https://tpb.party/browse/"]')
    magnet_link = row.select_one('a[href^="magnet:"]')
    cells = row.select("td")

    return {
        "name": name.get_text(strip=True),
        "href": name.get("href"),
        "category": category.get_text(strip=True).replace("\n", " "),
        "magnet_link": magnet_link.get("href"),
        # Seeds and Size likely to error when/if tpb changes layout.
        "seeds": cells[5].get_text(strip=True),
        "size": cells[4].get_text(strip=True),
    }


def scrape_torrents(html):
    soup = BeautifulSoup(html, "html.parser")
    torrents = []
    rows = soup.select("#searchResult tr")
    rows = [row for row in rows if len(row.select("td")) >= 8]

    for row in rows:
        torrent = scrape_tpb_rows(row)
        torrents.append(torrent)

    return torrents


@api.get("/torrents/retitle/videos")
def retitle_videos(torrent_id):
    """
    Apply set_video_title on all video files in torrent (only covers mp4 and mkv)
    """

    try:
        videos = torrent_video_files(torrent_id)
        for video in videos:
            logger.info(f"Setting title on {video}")
            set_video_title(video.__str__())
        return {"detail": f"Video titles set on {torrent_id}"}

    except RuntimeError as e:
        raise HTTPException(500, e)

    except FileNotFoundError as e:
        raise HTTPException(
            404, f"Video file not found (in Torrent: {torrent_id}) error: {e}"
        )

    except ValueError as e:
        raise HTTPException(
            500, f"Unable to retitle videos in Torrent: {torrent_id} [{e}]"
        )


PINNED_KEY = "pinned_queries"


def get_pinned_queries():
    queries = list(redis.smembers(PINNED_KEY))
    if queries:
        return queries
    else:
        return []


class PinnedQueryIn(BaseModel):
    query: str


@api.post("/pinned")
async def pin_query(payload: PinnedQueryIn):
    query = payload.query
    redis.sadd(PINNED_KEY, query)
    queries = get_pinned_queries()

    return {
        "query": query,
        "pinned": True,
        "queries": queries,
    }


@api.delete("/pinned/{query}")
async def unpin_query(query: str):
    redis.srem(PINNED_KEY, query)
    queries = get_pinned_queries()

    return {
        "query": query,
        "pinned": False,
        "queries": queries,
    }


@api.get("/pinned")
async def get_pinned():
    queries = get_pinned_queries()

    return {
        "queries": queries,
    }


@api.get('/df', tags=["api"])
def df():
    out = subprocess.check_output(
        ["df", "-h"] + list(config.mounts),
        text=True
    ).splitlines()

    out[0] = re.sub(r'Use%', r'UsedPercent', out[0])
    h = out[0].split()

    data = []
    for line in out[1:]:
        row = dict(zip(h, line.split()))
        if 'UsedPercent' in row:
            row['UsedPercent'] = int(row['UsedPercent'].rstrip('%'))
        data.append(row)

    return data

@api.get("/health", tags=["api"])
@api.head("/health", tags=["api"])
def health_check():
    """
    A simple health check endpoint that confirms the API server is running.
    This is useful for container orchestration systems (like Docker Swarm or
    Kubernetes) and load balancers to verify service availability.
    """
    return {"status": "ok"}


@api.get("/docs", include_in_schema=False)
async def api_documentation(request: Request):
    return HTMLResponse(
        """
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>Elements in HTML</title>

    <script src="https://unpkg.com/@stoplight/elements/web-components.min.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/@stoplight/elements/styles.min.css">
  </head>
  <body>

    <elements-api
      apiDescriptionUrl="/api/openapi.json"
      router="hash"
    />

  </body>
</html>"""
    )


@api.get("/config")
def get_config():
    return OmegaConf.to_container(config)


@api.post("/config")
async def update_config(payload: Request):
    global config
    try:
        data = await payload.json()
        new_conf = OmegaConf.create(data)
        merged = OmegaConf.merge(config, new_conf)
        config_path.write_text(config_to_yaml(merged))
        config = merged
        return OmegaConf.to_container(merged)
    except Exception as e:
        return f"{e}"


@api.get("/external_links")
def get_external_links():
    return JSONResponse(OmegaConf.to_container(config.external_links, resolve=True))


@api.post("/torrents/magnet/new")
async def torrent_add(payload: MagnetActionIn):
    magnet_url = payload.magnet_url
    transmission = Transmission(host=config.transmission.host)
    result = transmission.add_torrent(magnet_url)
    return {"info": f"Added torrent {result}"}


@api.post("/torrents/downloaded/rename")
async def post_torrents_downloaded_rename(payload: DownloadedFileRenameIn):
    response = downloaded_file_rename(**payload.dict())
    return response


@api.post("/torrents/active/rename")
async def torrent_file_rename_route(payload: TorrentRenameIn):
    response = torrent_file_rename(**payload.model_dump())
    return response


@api.post("/torrents/active/files/rename")
async def torrent_files_rename_route(payload: TorrentFilesRenameIn):
    errors = []
    responses = []
    torrent_id = payload.torrent_id
    renames = payload.renames

    for rename in renames:
        try:
            response = torrent_file_rename(torrent_id, rename.filename, rename.newname)
            responses.append(response)
        except Exception as e:
            errors.append(e.__str__())

    return {
        "detail": f"Rename files in {torrent_id}",
        "responses": responses,
        "errors": errors,
    }


@api.get("/torrents/poster/search")
async def search_torrent_posters(query: str = Query(...)):
    url = f"https://www.rottentomatoes.com/search?search={query}"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            html = response.text
            poster_url = scrape_poster_top_result(html)
            return JSONResponse({"url": poster_url})
        raise HTTPException(status_code=404, detail=f"{query} - returned no results")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api.get("/torrents/search/scrape")
async def search_torrents(query: Optional[str] = Query(None)):
    if not query:
        raise HTTPException(status_code=404, detail="search query not specified")

    if query.startswith("magnet:"):
        transmission = Transmission(host=config.transmission.host)
        result = transmission.add_torrent(query)
        return {"info": f"Added torrent {result}"}

    url = f"https://tpb.party/search/{query}/1/99/0"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            html = response.text
            torrents_data = scrape_torrents(html)
            if torrents_data:
                # check here
                torrents_data = check_existing_media(torrents_data)
                return {"results": torrents_data}
            raise HTTPException(
                status_code=404, detail=f"{query} - returned no results"
            )
        raise HTTPException(status_code=500, detail="Failed to fetch search results")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# utils/scrapers.py
def scrape_magnet(html: str) -> Optional[str]:
    soup = BeautifulSoup(html, "html.parser")
    magnet_link = soup.select_one('a[href^="magnet:"]')
    return str(magnet_link.get("href")) if magnet_link else None


@api.get("/torrents/active")
def get_torrents_active():
    """
    Endpoint to get active torrents and files that have been downloaded.

    Returns:
        dict: A dictionary with lists of 'downloading' and 'downloaded' torrents and files.
    """

    folders = []
    files = []
    downloading = []
    exclude_from_downloaded = set()

    for dirpath, dirnames, filenames in os.walk(config.downloads):
        folders.extend(dirnames)
        files.extend(filenames)
        break

    try:
        torrents = Transmission(host=config.transmission.host).get_torrents()
    except Exception as e:
        return {"error": f"Failed to fetch torrents: {str(e)}"}

    for torrent in torrents:
        try:
            time_left = torrent.size_when_done - torrent.left_until_done
            percent = (
                int((time_left / torrent.size_when_done) * 100)
                if torrent.size_when_done
                else 0
            )
            speed = torrent.rate_download
        except Exception:
            percent = 0
            speed = 0

        downloading.append(
            {
                "files": torrent.get_files(),
                "id": torrent.hash_string,
                "name": torrent.name,
                "addedDate": torrent.added_date.timestamp(),
                "percent": percent,
                "speed": speed,
                "total": torrent.size_when_done,
                "stats": torrent.tracker_stats,
                "ratio": torrent.ratio,
                "downloadRate": torrent.rate_upload,
                "uploadRate": torrent.rate_download,
                "secondsDownloading": torrent.seconds_downloading,
                "magnet": torrent.magnet_link,
            }
        )

        exclude_from_downloaded.add(torrent.name)

    exclude_from_downloaded.update(
        filename for filename in files if filename.endswith(".part")
    )
    downloaded = set(folders + files).difference(exclude_from_downloaded)

    return {"downloading": downloading, "downloaded": list(downloaded)}


@api.get("/torrents/active/remove")
def torrent_remove(torrent_id: str):
    torrent = remove_torrent(torrent_id)
    return {"info": f"Removed torrent {torrent.name}"}


@api.post("/torrents/cleanup")
def torrent_cleanup(payload: TorrentCleanupIn):
    failed = []
    files = payload.files
    filepath = ""

    for file in files:
        try:
            filepath = Path(config.downloads, file)
            if filepath.exists():
                if filepath.is_dir():
                    shutil.rmtree(filepath)
                else:
                    os.remove(filepath)
            else:
                failed.append(str(filepath))
        except Exception:
            failed.append(str(filepath))

    if files:
        root = Path(files[0]).parents[-2]
        directories = [directories for dirpaths, directories, files in os.walk(root)]
        logger.info("Cleanup directories...")
        logger.info(directories)

    info = "Ran torrent files cleanup, check failed list"

    return {
        "info": info,
        "failed": failed,
    }


@api.get("/torrents/files/delete")
def files_delete(filename):
    path = torrent_download_path(filename)
    context = "unknown"
    if not os.path.exists(path):
        raise HTTPException(404, f"{filename} not found in downloads")
    try:
        if os.path.isdir(path) and path != config.downloads:
            context = "directory"
            shutil.rmtree(path)
        else:
            context = "file"
            os.remove(path)
        return {"info": f"Deleted ({context}) {filename}"}
    except Exception as e:
        raise HTTPException(500, f"{e}\ncontext: {context}::{filename}")


@api.get("/torrents/files/move/{destination}")
def files_move_to_destination(
    request: Request, destination: str, filename: str = Query(...)
):
    media = config.media[destination]
    if media and media.directory:
        directory = media.directory
        return download_torrent_files_move_to(
            filename, directory, media=destination, headers=request.headers
        )

    raise HTTPException(404, f"Cannot find destination: {destination}")


@api.get("/torrents/active/delete")
def torrent_delete(torrent_id: str):
    torrent = remove_torrent(torrent_id, delete=True)
    return {"info": f"Deleted torrent {torrent.name} & files"}


@api.get("/random-image")
def get_random_image():
    image_dir = config.images or "/images"
    if os.path.exists(image_dir):
        image_files = [
            f for f in os.listdir(image_dir) if f.lower().endswith(loadable_images)
        ]
        if not image_files:
            return {"info": "No jpeg images found in the specified path."}
        random_image = random.choice(image_files)
        image_path = os.path.join(image_dir, random_image)
        return FileResponse(image_path)
    return {"info": f"{image_dir} doesn't exist"}


@api.get("/storage/list/{section}")
def get_storage_list(section: str):
    config_section = config.media[section]
    if config_section and config_section.directory:
        directory = Path(config_section.directory)
        return [entry for entry in directory.iterdir() if entry.is_dir]

    raise HTTPException(404, "Storage section Not found: {section}")


app.include_router(api, prefix="/api", tags=["api"])

app.mount("/", StaticFiles(directory="dist", html=True), name="vite_dist")

if __name__ == "__main__":
    print("Starting http/json api for torrentbox")
