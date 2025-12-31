import re
from pathlib import Path
from pydantic.dataclasses import dataclass

# We would expect a file location (tbd: folder or file)
# From this we would determine if the file or folder contains tv series episodes using global de factor episode naming pattern

# Predetermined 
# we will be given:
# - an a series folder, it will be called series.
# - we will know that the global de facto case insensitive episode naming pattern will be used, to determine episiode files, as those matching the pattern.
# - and we will have a set of epiosde_exts (a list of strings, these will be like pathlib exts, but without a '.'
