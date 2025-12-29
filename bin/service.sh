#!/bin/bash

# DEV Mode FastAPI
FASTAPI_PORT=${1:-8880}

cd apiserver
. .venv/bin/activate
.venv/bin/fastapi dev --port $FASTAPI_PORT --host 0.0.0.0 &
FASTAPI_PID=$!

# Static build mode for vite
cd ..
eval $($HOME/.local/share/fnm/fnm env --shell bash)
vite build

function cleanup {
    kill "$FASTAPI_PID"
    wait "$FASTAPI_PID"
    exit 0
}

trap cleanup SIGTERM SIGINT
wait -n
exit $?
