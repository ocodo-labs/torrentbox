import re
from pathlib import Path
from pydantic.dataclasses import dataclass

# Notes for handling a tv series file/folder structure

# Definition: Series 
# - in this module we assume a series is a folder containing tv series episodes, in a flat, or nested folder structure.

# Predetermined 
# we will be given:
# - an a series folder, it will be called series.
# - we will know that the global de facto case insensitive episode naming pattern will be used, to determine episiode files, as those matching the pattern.
# - and we will have a set of epiosde_exts (a list of strings, these will be like pathlib exts, but without a '.'
