import { type MediaItemNameFilter, type MediaListingItem } from "@/types/media-listing-interfaces";
import { toast } from "sonner";

export const fetchListingMagnet = async (
  href: string
): Promise<string | null> => {
  try {
    const response = await fetch("api/torrents/1337x-magnet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ href }),
    });
    const data = await response.json();
    return data.magnet || null;
  } catch (err) {
    return null;
  }
};

export const fetchAndAddMediaItemMagnet = async (
  mediaItem: MediaListingItem,
  addMagnet: (magnet: string) => Promise<void>
) => {
  toast(`Waiting for ${mediaItem.name}`);
  const magnet = await fetchListingMagnet(mediaItem.href);
  if (magnet) {
    await addMagnet(magnet);
    toast(`Added ${mediaItem.name}`);
  } else {
    toast(`No magnet link for ${mediaItem.name}`);
  }
};

type FetchListingParams<T> = {
  linksUrl: string;
  setData: (data: T) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

export function fetchListingFactory<T>({
  linksUrl,
  setData,
  setLoading,
  setError,
}: FetchListingParams<T>) {
  return async function fetchLinkListings(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(linksUrl);
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data: T = await response.json();
      console.log(`Fetching list from ${linksUrl}`);
      console.log(data);
      setData(data);
    } catch (err) {
      console.error(err);
      setError("Failed to get link listing from server");
    } finally {
      setLoading(false);
    }
  };
}

export const applyNameFilters = (
  name: string,
  filters?: MediaItemNameFilter[]
): string => {
  let modifiedName = name;

  const matchingFilters = filters?.filter((filter) =>
    modifiedName.match(filter.pattern)
  );

  matchingFilters?.forEach((filter) => {
    if (filter && filter.replacement) {
      modifiedName = modifiedName.replace(filter.pattern, filter.replacement);
    }
  });

  return modifiedName;
};

export const cleanNameForPoster = (name: string): string => {
  if (name.length == 4 || name.length == 6) {
    return name
  }

  return name.replace(/\d{4}/, '')
}

export const cleanNameForSearch = (name: string): string => {
  let cleanName = name
    .replace(/^(.*?)(2\d{3}|19\d{2}).*$/, "$1 $2")
    .trim()
    .replaceAll(".", " ")
    .replaceAll(/[()]/g, "");

  if (!cleanName) {
    cleanName = name;
  }

  return cleanName;
};

export const fetchPosterForMediaItem = async (media: MediaListingItem) => {
  let cleanName = cleanNameForPoster(cleanNameForSearch(media.name));

  const response = await fetch(
    `api/torrents/poster/search?query=${encodeURIComponent(cleanName)}`
  );

  if (response.ok) {
    const data = await response.json();
    if (data.url) {
      if ((data.url as string).includes('fit-in')) {
        data.url = data.url.replace(/fit-in\/(.*?)\//,`fit-in/${Math.floor((9/16) * 320)}x320/`)
      }

      if (media.setImageUrl) {
        media.setImageUrl(data.url);
      } else {
        // if there's no setter, assume the var is writable.
        media.imageUrl = data.url;
      }
    }
  }
};
