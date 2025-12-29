import type { StorageNamePath } from "@/contexts/storage-provider";


export const stripSeasonEpisode = (name: string): string => {
  // Strip any S01E01 type patterns at the end of the string
  return name.replace(/(S\d{2}E\d{2})$/, '').trim();
};

export const isDuplicateShowName = (name: string, tvShows: StorageNamePath[]): boolean => {
  // Check if the given name already exists in the tvShows list (case-insensitive)
  const strippedName = stripSeasonEpisode(name).toLowerCase();
  return tvShows.some(show => show.name.toLowerCase() === strippedName);
};

export const validateNewShowName = (name: string, tvShows: StorageNamePath[]): { isValid: boolean, error?: string } => {
  const strippedName = stripSeasonEpisode(name);
  
  // If name is empty after stripping or is invalid, return an error
  if (strippedName.length === 0) {
    return { isValid: false, error: 'Please enter a valid show name.' };
  }

  // If name exists already, return error
  if (isDuplicateShowName(strippedName, tvShows)) {
    return { isValid: false, error: 'A TV show with this name already exists.' };
  }

  return { isValid: true };
};
