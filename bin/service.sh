#!/bin/bash

eval $(/home/jason/.local/share/fnm/fnm env --shell bash)

$(which npx) next -p 8880 -H 0.0.0.0
