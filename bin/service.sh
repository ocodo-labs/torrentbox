#!/bin/bash

# DEV Mode FastAPI
FASTAPI_PORT=${1:-8880}

cd apiserver
. .venv/bin/activate
.venv/bin/granian --interface asgi --host 0.0.0.0 --port $FASTAPI_PORT app:app

