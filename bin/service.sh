#!/bin/bash

eval $(/home/jason/.local/share/fnm/fnm env --shell bash)

$(which npx) vite --port 8880 --host 0.0.0.0
