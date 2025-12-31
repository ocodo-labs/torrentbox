import os
import subprocess
import shutil
from pathlib import Path
import re
import json
import sys
import logging
import requests
import random
from fastapi import FastAPI, Request, APIRouter, HTTPException, Query
from pydantic import BaseModel
from pydantic.dataclasses import dataclass
from typing import Optional, List
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from omegaconf import OmegaConf
from omegaconf.errors import OmegaConfBaseException
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from bs4 import BeautifulSoup
from transmission_rpc import Client as Transmission
from ollama import Client as Ollama
from redis import Redis
from ruamel.yaml import YAML
from io import StringIO
import pystache

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


class SuggestNamesIn(BaseModel):
    filename: str
    model: Optional[str] = None


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
class ConfigNamingSettings:
    hosts: List[str]
    models: List[str]


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
    downloads: str
    external_links: List[ExternalLink]
    media: ConfigMediaSettings
    naming: ConfigNamingSettings
    transmission: ConfigTransmissionSettings
    valid_extensions: List[str]
    filters: ConfigFiltersSettings
    images: str


redis = Redis(decode_responses=True)
loadable_images = (".png", ".jpg", ".jpeg", ".gif", ".webp")


def render_mustache_template(template_path: str, context: dict) -> str:
    template = Path(template_path).read_text()
    rendered_template = pystache.render(template, context)
    return rendered_template


def invalidate_cache(namespace: str):
    for key in redis.keys(f"{namespace}*"):
        redis.delete(key)


app = FastAPI(
    title="torrentbox",
    version=" handmaiden-revolt",
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
    # OmegaConf to_yaml is subpar use ruamel.yaml + StringIO
    data = OmegaConf.to_container(config)
    yaml = YAML()
    yaml.indent(sequence=4, offset=2)
    stream = StringIO()
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
load_dotenv()


def clean_llm_json_response(content: str) -> str:
    # Remove Markdown-style code block (```json ... ```)
    code_block_pattern = re.compile(r"```(?:json)?\s*(\{.*?\})\s*```", re.DOTALL)
    match = code_block_pattern.search(content)

    if match:
        return match.group(1).strip()

    return content.strip()


def get_ollama_host():
    ollama_host = redis.get("ollama_host")
    logger.info(ollama_host)
    try:
        if ollama_host:
            response = requests.get(ollama_host, timeout=0.2)
            if response.status_code == 200:
                return ollama_host
            else:
                redis.delete("ollama_host")
    except Exception:
        redis.delete("ollama_host")

    for host in config.naming.hosts:
        try:
            response = requests.get(host, timeout=1)
            if response.status_code == 200:
                redis.set("ollama_host", host)
                return host
        except Exception:
            logger.error(f"Connection error to {host}")

    logger.error("No ollama hosts available")
    return None


def get_ollama_models(host):
    response = requests.get(f"{host}/api/tags")
    if response.status_code == 200:
        data = response.json()
        return [model for model in data["models"]]

    raise ValueError(f"Failed to retrieve models from {host}")


def get_ollama_model(name, host=get_ollama_host()):
    models = get_ollama_models(host)
    if not models:
        raise ValueError(f"Models not found on {host}")

    model = next(
        (model for model in models if model["name"] == name or name in model["name"]),
        None,
    )

    if model:
        return model

    raise ValueError(f"Model {name} not found")


def use_valid_extension_or_remove(extension):
    if extension in config.valid_extensions:
        return extension
    else:
        return ""


def dedupe_suggestions(suggestions):
    return list(set(suggestions))


def fix_suggestion_extensions(filename, suggestions):
    # Always use the extension of the given filename
    extension = os.path.splitext(filename)[1]

    extension = use_valid_extension_or_remove(extension)

    for i, s in enumerate(suggestions):
        s_base, s_ext = os.path.splitext(s)
        if s_ext != extension:
            suggestions[i] = s_base + extension
    return suggestions


def filename_suggestions(
    filename, model=config.naming.models[0], models=config.naming.models, max_tries=10
):
    prompt = render_mustache_template(
        os.path.join("templates", "prompt.mustache"), {"filename": filename}
    )

    suggestions = None
    try_count = 0

    host = get_ollama_host()

    if host is None:
        msg = "No ollama host is available"
        logger.info(msg)
        raise Exception(msg)

    ollama = Ollama(host=host)
    ollama_host_models = get_ollama_models(host)

    if ollama_host_models is None:
        msg = f"No models on {host}"
        raise Exception(msg)

    for llm in ollama_host_models:
        logger.info(f" - {llm}")

    host_model_names = [m.get("name") for m in ollama_host_models if "name" in m]

    if model not in host_model_names:
        fallback_model = next(
            (
                m
                for m in config.naming.models
                if any(m == h.get("name") for h in ollama_host_models)
            ),
            None,
        )

        if fallback_model:
            model = fallback_model
        else:
            model = host_model_names[0]

    while suggestions is None:
        response = ollama.chat(
            model=model, messages=[{"role": "user", "content": prompt}]
        )

        try:
            logger.info("Ollama response message content")
            content = response["message"]["content"]
            content = clean_llm_json_response(content)
            suggestions = json.loads(content)
            logger.info("LLM suggested:")
            logger.info(suggestions)
            suggestions["suggestions"] = fix_suggestion_extensions(
                filename, suggestions["suggestions"]
            )

            return suggestions

        except Exception:
            try_count += 1
            suggestions = None
            if try_count > max_tries:
                raise Exception(f"{try_count} max retries, unable to get suggestions")

    return suggestions


def filter_words(word_list):
    filter_words = [word.lower() for word in config.filters.words]
    return [word for word in word_list if word.lower() not in filter_words]


def preprocess_title(title: str) -> set:
    title = os.path.splitext(title)[0]
    title = re.sub(r"['\"]", "", title)
    title = re.sub(r"[._+-]", " ", title)
    words = [word for word in title.split() if word.isalnum()]
    words = filter_words(words)
    return list(set(words))


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


def download_torrent_files_move_to(filename, destination, media):
    path = Path(torrent_download_path(filename))
    dest = Path(destination)

    if not path.exists():
        raise HTTPException(404, f"{filename} not found")

    try:
        # TODO 
        # if  media == "tvshows":
        # 1. New series use defaults 
        # 2. Existing series use series rules
        #    - Scan episode file layout
        #      From that we can determine season folders are used, named, etc.
        #         - we expect episodes to be stored per folder:
        #    - 1 season - flat not sub folders
        #    - greater than 1 season - make folders for
        #      - seasons and move S01 episodes into S01 folder
        #      - make new season folder only when there is a new season episode to place in that folder.
        # see: tv_series_storage_analysis.py

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


def set_video_title(filename: str, title: str = None):
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


@api.get("/llm/status")
def get_llm_status():
    try:
        if get_ollama_host():
            return Response(status_code=200)
    except Exception:
        pass

    raise HTTPException(404)


@api.post("/llm/suggest_names")
def post_llm_suggest_names(b: SuggestNamesIn):
    try:
        suggestions = filename_suggestions(b.filename)
    except Exception as e:
        return HTTPException(500, "Message: {}, ollama server error".format(e))

    try:
        payload = suggestions
    except Exception as e:
        return HTTPException(500, "Message: {}, ollama suggestions error".format(e))

    return payload


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
    return magnet_link.get("href") if magnet_link else None


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

    for file in files:
        try:
            filepath = os.path.join(config.downloads, file)
            if os.path.exists(filepath):
                if os.path.isdir(filepath):
                    shutil.rmtree(filepath)
                else:
                    os.remove(filepath)
            else:
                failed.append(filepath)
        except Exception:
            failed.append(filepath)

    if files:
        root = Path(files[0]).parents[-2] if files else None
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
def files_move_to_destination(destination: str, filename: str = Query(...)):
    media = config.media[destination]
    if media and media.directory:
        directory = media.directory
        return download_torrent_files_move_to(filename, directory, media=destination)

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


@api.get("/urls")
def get_all_urls():
    url_list = [
        {"path": f"/api{route.path}", "name": route.name, "methods": route.methods}
        for route in api.routes
    ]
    return url_list


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
