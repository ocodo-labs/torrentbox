import { serverBaseUrl } from "@/config";
import { createContext, useState, type Dispatch, type FC, type ReactNode, type SetStateAction } from "react";
import { toast } from "sonner";

export type StorageNamePath = {name: string, path: string}
export type StorageTVLibrary = StorageNamePath[]
export type StorageMovieLibrary = StorageNamePath[]

export interface StorageContextType {
  tvShows: StorageTVLibrary;
  setTVShows: Dispatch<SetStateAction<StorageTVLibrary>>;
  fetchTVShowList: () => Promise<void>;
  movies: StorageMovieLibrary;
  setMovies: Dispatch<SetStateAction<StorageMovieLibrary>>;
  fetchMovieList: () => Promise<void>;
  refreshTopLists: () => Promise<void>;
  clearTopLists: () => void;
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
        const showsMapped = data.map((p: string) => ({path: p, name: p.split('/').pop()}))
        setTVShows(showsMapped);
      }
    } catch {
      toast.error('Error fetching TV Show list');
    }
  }

  const refreshTopLists = async () => {
    await fetchMovieList();
    await fetchTVShowList();
  }

  const clearTopLists = () => {
    setTVShows([])
    setMovies([])
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
      clearTopLists,
      refreshTopLists,
    }}>
      {children}
    </StorageContext.Provider>
  )
}
