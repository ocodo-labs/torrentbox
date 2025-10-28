import type { MediaListingItem } from "@/contexts/media-listing-interfaces";
import { toast } from "sonner";

export const fetchListingMagnet = async (
  href: string
): Promise<string | null> => {
  try {
    const response = await fetch("/api/torrents/1337x-magnet", {
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

type FetchTop100GeneratorParams<T> = {
  apiUrl: string;
  setData: (data: T) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

export function fetchListingFactory<T>({
  apiUrl,
  setData,
  setLoading,
  setError,
}: FetchTop100GeneratorParams<T>) {
  return async function fetchTop100Movies(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl);
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data: T = await response.json();
      console.log(data);
      setData(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch top movies");
    } finally {
      setLoading(false);
    }
  };
}
