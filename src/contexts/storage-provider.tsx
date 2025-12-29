import { serverBaseUrl } from "@/config";
import { createContext, useState, type Dispatch, type FC, type ReactNode, type SetStateAction } from "react";
import { toast } from "sonner";

export type StorageTVLibrary = { name: string, path: string }[]
export type StorageMovieLibrary = { name: string, path: string }[]

export interface StorageContextType {
  tvShows: StorageTVLibrary;
  setTVShows: Dispatch<SetStateAction<StorageTVLibrary>>;
  fetchTVShowList: () => Promise<void>;
  movies: StorageMovieLibrary;
  setMovies: Dispatch<SetStateAction<StorageMovieLibrary>>;
  fetchMovieList: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const StorageContext = createContext<StorageContextType>({} as StorageContextType);

export const StorageProvider: FC<{ children: ReactNode }> = ({ children }) => {

  const [tvShows, setTVShows] = useState<StorageTVLibrary>([]);
  const [movies, setMovies] = useState<StorageMovieLibrary>([]);

  const fetchTVShowList = async () => {
    try {
      const response = await fetch(
        `${serverBaseUrl}/storage/list/tvshows`
      )
      if (response.ok) {
        const data = await response.json();
        setTVShows(data);
      }
    } catch {
      toast.error('Error fetching TV Show list');
    }
  }

  const refresh = async () => {
    await fetchMovieList();
    await fetchTVShowList();
  }

  const fetchMovieList = async () => {
    try {
      const response = await fetch(
        `${serverBaseUrl}/storage/list/tvshows`
      )
      if (response.ok) {
        const data = await response.json();
        setTVShows(data)
      }
    } catch {
      toast.error('Error fetching TV Show list')
    }
  }

  return (
    <StorageContext.Provider value={{
      tvShows,
      setTVShows,
      fetchTVShowList,
      movies,
      setMovies,
      fetchMovieList,
      refresh,
    }}>
      {children}
    </StorageContext.Provider>
  )
}
