import os
import shutil
import re
import json
import logging
import requests
from fastapi import FastAPI, Request, APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from omegaconf import OmegaConf
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from bs4 import BeautifulSoup
from transmission_rpc import Client as Transmission
from ollama import Client as Ollama
from starlette.responses import Response
from redis import Redis
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

redis = Redis(decode_responses=True)


def render_mustache_template(template_path: str, context: dict) -> str:
    with open(template_path, "r") as template_file:
        template = template_file.read()
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

config_path = os.path.join(os.path.dirname(__file__), "config.yaml")
config = OmegaConf.load(config_path)

print(OmegaConf.to_yaml(config))
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


def fix_extension(extension):
    if extension in config.valid_extensions:
        return extension
    else:
        return ""


def dedupe_suggestions(suggestions):
    return set(suggestions)


def fix_suggestion_extensions(filename, suggestions):
    # Get the extension of the given filename
    extension = os.path.splitext(filename)[1]

    extension = fix_extension(extension)
    logger.info("")

    # Iterate over suggestions
    for i, s in enumerate(suggestions):
        s_base, s_ext = os.path.splitext(s)

        # If the suggestion has a different extension, fix it
        if s_ext != extension:
            suggestions[i] = s_base + extension

    # Return the modified list of suggestions
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


def get_matches_from(directory: str, torrent_name: str, valid_exts: List[str]) -> List[str]:
    torrent_name_words = preprocess_title(torrent_name)
    matches = []
    for dirpath, _, files in os.walk(directory):
        for file_name in files:
            file_path = os.path.join(dirpath, file_name)
            file_ext = os.path.splitext(file_name)[1][
                1:
            ].lower()  # Extracting extension without the dot
            if file_ext not in valid_exts:
                continue
            file_name_words = preprocess_title(file_name)
            intersection_words = ordered_intersection(file_name_words, torrent_name_words)
            if intersection_words == file_name_words:
                matches.append(file_path)
            elif intersection_words == torrent_name_words[0:-1] and (torrent_name_words[-1]).isnumeric():
                matches.append(file_path)

    return matches


def torrent_download_path(filename):
    return os.path.join(config.downloads, filename)


def download_torrent_files_move_to(filename, destination):
    path = torrent_download_path(filename)
    if os.path.exists(path):
        try:
            shutil.move(path, destination)
            return {"info": f"Moved {filename} to {destination}"}
        except Exception as e:
            raise HTTPException(500, e)
    else:
        raise HTTPException(404, f"{filename} not found")


def torrent_file_rename(torrent_id, filename, newname):
    result = None
    try:
        transmission = Transmission(host=config.transmission.host)
    except Exception:
        raise HTTPException(404, f"Torrent {filename} not found")

    try:
        logger.info("Attempting rename")
        logger.info(f"  torrent_id: {torrent_id}")
        logger.info(f"  filename  : {filename}")
        logger.info(f"  newname   : {newname}")
        result = transmission.rename_torrent_path(
            torrent_id=torrent_id, location=filename, name=newname
        )

        return result
    except Exception as e:
        logger.error(f"Internal error renaming torrent {filename} to {newname}")
        logger.error(result)
        logger.error(e)
        raise HTTPException(
            500, f"Internal error renaming torrent {filename} to {newname}"
        )


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


def scrape_torrents(html):
    soup = BeautifulSoup(html, "html.parser")
    torrents_data = []
    rows = soup.select("#searchResult tr")
    rows = [row for row in rows if len(row.select("td")) >= 8]

    for row in rows:
        name = row.select_one('a[href^="https://tpb.party/torrent/"]')
        category = row.select_one('a[href^="https://tpb.party/browse/"]')
        magnet_link = row.select_one('a[href^="magnet:"]')

        cells = row.select("td")
        torrent = {
            "name": name.get_text(strip=True),
            "category": category.get_text(strip=True).replace("\n", " "),
            "magnet_link": magnet_link.get("href"),
            "seeds": cells[5].get_text(strip=True),
            "size": cells[4].get_text(strip=True),
        }

        torrents_data.append(torrent)

    return torrents_data


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
    return HTMLResponse("""
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
</html>""")


class MagnetActionIn(BaseModel):
    magnet_url: str


class TorrentRenameIn(BaseModel):
    torrent_id: Optional[str] = None
    filename: str
    newname: str


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


@api.post("/torrents/magnet/new")
async def torrent_add(payload: MagnetActionIn):
    magnet_url = payload.magnet_url
    transmission = Transmission(host=config.transmission.host)
    result = transmission.add_torrent(magnet_url)
    invalidate_cache("torrents")
    return {"info": f"Added torrent {result}"}


@api.post("/torrents/downloaded/rename")
async def post_torrents_downloaded_rename(payload: DownloadedFileRenameIn):
    response = downloaded_file_rename(**payload.dict())
    invalidate_cache("torrents")
    return response


@api.post("/torrents/active/rename")
async def torrent_file_rename_route(payload: TorrentRenameIn):
    response = torrent_file_rename(**payload.dict())
    invalidate_cache("torrents")
    return response


class QueryIn(BaseModel):
    query: Optional[str] = None


@api.get("/torrents/search/scrape")
async def search_torrents(query: Optional[str] = Query(None)):
    if not query:
        raise HTTPException(status_code=404, detail="search query not specified")

    if query.startswith("magnet:"):
        transmission = Transmission(host=config.transmission.host)
        result = transmission.add_torrent(query)
        invalidate_cache("torrents")
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
        except Exception:
            percent = 0

        downloading.append(
            {
                "name": torrent.name,
                "id": torrent.hash_string,
                "percent": percent,
                "files": torrent.get_files(),
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
    invalidate_cache("torrents")
    return {"info": f"Removed torrent {torrent.name}"}


@api.post("/torrents/cleanup")
def torrent_cleanup(payload: TorrentCleanupIn):
    failures = []
    torrent_id = payload.torrent_id
    torrent_name = payload.name
    files_to_delete = payload.files

    for file in files_to_delete:
        try:
            filepath = os.path.join(config.downloads, file)
            app.logger.info(f"Deleting torrent discarded file: {filepath}")
            if os.path.exists(filepath):
                if os.path.isdir(filepath):
                    shutil.rmtree(filepath)
                else:
                    os.remove(filepath)
            else:
                failures.append(filepath)
        except Exception:
            failures.append(filepath)

    info = "Ran torrent files cleanup, check failed_to_delete"
    invalidate_cache("torrents")
    return {
        "info": info,
        "name": torrent_name,
        "torrent_id": torrent_id,
        "files": files_to_delete,
        "failed_to_delete": failures,
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
        return download_torrent_files_move_to(filename, directory)

    raise HTTPException(404, f"Cannot find destination: {destination}")


@api.get("/torrents/active/delete")
def torrent_delete(torrent_id: str):
    torrent = remove_torrent(torrent_id, delete=True)
    invalidate_cache("torrents")
    return {"info": f"Deleted torrent {torrent.name} & files"}


app.include_router(api, prefix="/api", tags=["api"])

app.mount("/", StaticFiles(directory="dist", html=True), name="vite_dist")

if __name__ == "__main__":
    print("Starting http/json api for torrentbox")
