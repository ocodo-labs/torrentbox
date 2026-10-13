import { json_header, serverBaseUrl } from '@/config';
import { useLeadingEdgeDebounce } from '@/lib/debounce';
import { notifyCompletion } from '@/lib/utils';
import type {
  DestructiveDownloadedFileAction,
  DestructiveTorrentAction,
} from '@/types/actions';
import {
  type SoftDeletedFileType,
  SoftDeletedFile,
} from '@/types/soft-deleted-file';
import {
  type Torrent,
  type TransmissionData,
  type TorrentFile,
} from '@/types/torrent';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import videoFileExtensions from 'video-extensions';
import subtitleFileExtensions from '@/lib/subtitle-file-extensions';
import { playSound } from '@/lib/play-sound';
import { useLocalStorage } from 'usehooks-ts';
import { suggestRename } from '@/lib/rename/om-rename-engine';


export interface FileRenameType {
  filename: string;
  newname: string;
}

export interface RenameSuggestion {
  name: string;
  media_type: 'movie' | 'tv' | 'unknown';
  extension?: string;
  type?: string;
  year?: string;
  season?: number;
  episode?: number;
  matched_pattern?: string;
}

interface TransmissionContextType {
  torrents: Torrent[];
  sortedTorrents: Torrent[];
  toggleSort: (key: SortKey) => void;
  downloadedFiles: string[];
  connectionError: boolean;

  getFilenames: (torrent: Torrent) => string[];
  getActiveFilenames: (torrent: Torrent) => string[];
  getActiveFiles: (torrent: Torrent) => TorrentFile[];
  getShowVideoFilenames: (torrent: Torrent) => string[];
  getShowSubtitleFilenames: (torrent: Torrent) => string[];
  getShowFilenames: (torrent: Torrent) => string[];
  getVideoFilenames: (torrent: Torrent) => string[];
  isTVShowSeasonTorrent: (torrent: Torrent) => boolean;
  canRename: (torrent: Torrent) => boolean;

  fetchTorrents: () => Promise<void>;

  isSoftDeleted: (hash: string, index: number) => boolean;
  softDeleteTorrentSubFile: (torrent: Torrent, filename: string) => void;
  getTorrentSoftDeletedFiles: (torrent: Torrent) => string[];
  clearSoftDeleted: (torrent: Torrent) => void;

  handleAction: (
    item: Torrent | string,
    action: DestructiveDownloadedFileAction | DestructiveTorrentAction,
    options?: Record<string, string>
  ) => Promise<void>;

  handleRenameDownloaded: (item: string) => void;
  handleRenameTorrent: (torrent: Torrent, filename?: string) => void;
  confirmRename: () => void;
  cancelRenameTorrent: () => void;

  autoTitleVideos: (torrent: Torrent) => Promise<void>;
  batchRenameTorrentFiles: (
    torrent: Torrent,
    renames: FileRenameType[]
  ) => void;
  renameTorrent: (
    torrent: Torrent,
    currentFilename: string,
    newName: string
  ) => void;
  confirmRenameDownloadedFile: () => void;

  resetState: () => void;

  toggleExpand: (id: string) => void;
  expandedTorrent: string | null;
  setExpandedTorrent: Dispatch<SetStateAction<string | null>>;

  renameDialogOpen: boolean;
  setRenameDialogOpen: Dispatch<SetStateAction<boolean>>;

  showTVShowRenameDialog: boolean;
  setShowTVShowRenameDialog: Dispatch<SetStateAction<boolean>>;

  currentTorrent: Torrent | null;
  setCurrentTorrent: Dispatch<SetStateAction<Torrent | null>>;

  currentTorrentFilename: string | null;
  setCurrentTorrentFilename: Dispatch<SetStateAction<string | null>>;

  currentDownloadedFile: string | null;
  setCurrentDownloadedFile: Dispatch<SetStateAction<string | null>>;

  newName: string;
  setNewName: Dispatch<SetStateAction<string>>;

  suggestions: Set<string>;
  setSuggestions: Dispatch<SetStateAction<Set<string>>>;

  selectedTorrents: Set<string>;
  setSelectedTorrents: Dispatch<SetStateAction<Set<string>>>;
  executeSelectedTorrentsAction: (
    action: DestructiveTorrentAction
  ) => Promise<void>;

  addMagnet: (magnetUrl: string) => Promise<void>;
}

export const useTransmissionContext = (): TransmissionContextType => {
  const context = useContext(TransmissionContext);

  if (!context) {
    throw new Error(
      'useTransmissionContext must be used within a TorrentManagerProvider'
    );
  }

  return context;
};

const TransmissionContext = createContext<
  TransmissionContextType | undefined
>(undefined);

type SortKey = 'addedDate' | 'name';
type SortOrder = 'asc' | 'desc';

export const TransmissionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [downloadedFiles, setDownloadedFiles] = useState<string[]>([]);
  const [torrentSoftDeletedFiles, setTorrentSoftDeletedFiles] =
    useLocalStorage<SoftDeletedFile[]>('soft-deleted-files', []);

  const [connectionError, setConnectionError] = useState(false);

  const [expandedTorrent, setExpandedTorrent] = useState<string | null>(null);

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [currentTorrent, setCurrentTorrent] = useState<Torrent | null>(null);
  const [currentTorrentFilename, setCurrentTorrentFilename] = useState<
    string | null
  >(null);
  const [currentDownloadedFile, setCurrentDownloadedFile] = useState<
    string | null
  >(null);

  const [newName, setNewName] = useState('');
  const [suggestions, setSuggestions] = useState<Set<string>>(new Set());

  const [showTVShowRenameDialog, setShowTVShowRenameDialog] = useState(false);

  const [selectedTorrents, setSelectedTorrents] = useState<Set<string>>(
    new Set()
  );

  const suggestionsRequestId = useRef(0);

  const getFilenames = (torrent: Torrent) =>
    torrent.files.map((entry) => entry[0]);

  const getActiveFilenames = (torrent: Torrent) =>
    torrent.files
      .filter((_, index) => !isSoftDeleted(torrent.id, index))
      .map((entry) => entry[0]);

  const getActiveFiles = (torrent: Torrent) =>
    torrent.files.filter(
      (_, index) => !isSoftDeleted(torrent.id, index)
    );

  const getShowFilenames = (torrent: Torrent) =>
    getActiveFilenames(torrent).filter((filename) =>
      filename.toLowerCase().match(/(s\d+e\d+|\d+x\d{2,})/)
    );

  const getShowVideoFilenames = (torrent: Torrent) =>
    getVideoFilenames(torrent).filter((filename) =>
      filename.toLowerCase().match(/(s\d+e\d+|\d+x\d{2,})/)
    );

  const getShowSubtitleFilenames = (torrent: Torrent) =>
    getActiveFilenames(torrent).filter((filename) =>
      subtitleFileExtensions.some((extension) =>
        filename.toLowerCase().endsWith(extension)
      )
    );

  const getVideoFilenames = (torrent: Torrent) =>
    getActiveFilenames(torrent).filter((filename) =>
      videoFileExtensions.some((extension) =>
        filename.toLowerCase().endsWith(extension)
      )
    );

  const isTVShowSeasonTorrent = (torrent: Torrent) => {
    const videoFilenames = getVideoFilenames(torrent);

    return (
      videoFilenames.length > 1 &&
      videoFilenames.length === getShowVideoFilenames(torrent).length
    );
  };

  const canRename = (torrent: Torrent) => torrent?.files?.length > 0;

  const [sortKey, setSortKey] = useState<SortKey>('addedDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const sortByAddedDate = (a: Torrent, b: Torrent) =>
    a.addedDate - b.addedDate;

  const sortByName = (a: Torrent, b: Torrent) =>
    a.name.localeCompare(b.name);

  const sortStrategies = {
    addedDate: sortByAddedDate,
    name: sortByName,
  } as const;

  const sortedTorrents = useMemo(() => {
    const compare = sortStrategies[sortKey];

    return [...torrents].sort((a, b) => {
      const result = compare(a, b);
      return sortOrder === 'asc' ? result : -result;
    });
  }, [torrents, sortKey, sortOrder]);

  const toggleSort = (key: SortKey = 'addedDate') => {
    if (sortKey === key) {
      setSortOrder((previous) =>
        previous === 'asc' ? 'desc' : 'asc'
      );
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const fetchTorrents = useLeadingEdgeDebounce(async () => {
    try {
      const response = await fetch(
        `${serverBaseUrl}/torrents/active`,
        { headers: json_header }
      );

      if (!response.ok) {
        toast.error(
          `Failed to fetch torrents (${response.status})`
        );
        setConnectionError(true);
        return;
      }

      const data: TransmissionData = await response.json();
      const downloading: Torrent[] = data.downloading;

      setTorrents(downloading);
      setDownloadedFiles(data.downloaded);

      downloading.forEach((torrent) => notifyCompletion(torrent));

      setConnectionError(false);
    } catch {
      toast('Fetch Error');
      setConnectionError(true);
    }
  }, 1500);

  /*
   * Generate local rename suggestions immediately.
   *
   * The local engine is deterministic and does not depend on the LLM.
   * Both sources share the same Set so the UI can continue treating
   * suggestions as a single collection.
   */
  const generateLocalSuggestions = useCallback((filename: string) => {
    if (!filename) {
      return;
    }

    const localSuggestions = suggestRename(filename);

    setSuggestions((current) => {
      const next = new Set(current);

      for (const suggestion of localSuggestions) {
        next.add(suggestion.name);
      }

      return next;
    });
  }, []);

  /*
   * The provider owns the relationship between rename state and
   * suggestions.
   */
  const suggestionFilename = useMemo(() => {
    if (!renameDialogOpen) {
      return null;
    }

    if (currentDownloadedFile) {
      return currentDownloadedFile;
    }

    if (currentTorrentFilename) {
      const torrentName = currentTorrent?.name;

      if (!torrentName) {
        return currentTorrentFilename;
      }

      const escapedTorrentName = torrentName.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );

      return currentTorrentFilename.replace(
        new RegExp(`^${escapedTorrentName}/`),
        ''
      );
    }

    return currentTorrent?.name ?? null;
  }, [
    renameDialogOpen,
    currentDownloadedFile,
    currentTorrent,
    currentTorrentFilename,
  ]);

  /*
   * Generate local suggestions. The LLM fetch is handled separately
   * and is no longer combined with local generation.
   */
  useEffect(() => {
    if (!suggestionFilename) {
      suggestionsRequestId.current += 1;
      setSuggestions(new Set());
      return;
    }

    generateLocalSuggestions(suggestionFilename);
  }, [
    suggestionFilename,
    generateLocalSuggestions,
  ]);

  const confirmRenameDownloadedFile = async () => {
    if (!currentDownloadedFile) return;

    try {
      const response = await fetch(
        `${serverBaseUrl}/torrents/downloaded/rename`,
        {
          method: 'POST',
          headers: json_header,
          body: JSON.stringify({
            filename: currentDownloadedFile,
            newname: newName,
          }),
        }
      );

      if (response.ok) {
        toast(
          `Renamed ${currentDownloadedFile} to ${newName}`
        );
      }
    } catch (error) {
      console.log(
        'Error renaming downloaded file:',
        error
      );
      toast(
        `Failed to rename ${currentDownloadedFile}`
      );
    }
  };

  const confirmRename = async () => {
    if (currentDownloadedFile) {
      await confirmRenameDownloadedFile();
      setRenameDialogOpen(false);
      return;
    }

    if (currentTorrent) {
      const filename =
        currentTorrentFilename || currentTorrent.name;

      await renameTorrent(
        currentTorrent,
        filename,
        newName
      );
    }

    resetState();
    setRenameDialogOpen(false);
  };

  const autoTitleVideos = async (torrent: Torrent) => {
    const torrent_id = torrent.id;

    const videosLength = torrent.files.filter((file) =>
      ['mp4', 'mkv'].some((extension) =>
        file[0].endsWith(extension)
      )
    ).length;

    const videos =
      videosLength > 1 ? 'videos' : 'video';

    const message =
      `Auto titled ${videos} in ${torrent.name}`;

    const errorMessage =
      `Error when titling ${videos} in ${torrent.name}`;

    try {
      const response = await fetch(
        `${serverBaseUrl}/torrents/retitle/videos?torrent_id=${torrent_id}`
      );

      if (response.ok) {
        toast(message);
      } else {
        toast(errorMessage);
      }
    } catch {
      toast(errorMessage);
    }
  };

  const executeSelectedTorrentsAction = async (
    action: DestructiveTorrentAction
  ) => {
    const torrentsSelected = torrents.filter(
      (torrent) => selectedTorrents.has(torrent.id)
    );

    await Promise.all(
      torrentsSelected.map((torrent) =>
        executeTorrentAction(action, torrent)
      )
    );
  };

  const executeTorrentAction = async (
    action: DestructiveTorrentAction,
    torrent: Torrent
  ) => {
    try {
      const torrent_id = torrent.id;

      const response = await fetch(
        `${serverBaseUrl}/torrents/active/${action}?torrent_id=${torrent_id}`,
        { headers: json_header }
      );

      if (!response.ok) {
        console.log(
          `Network error performing torrent action: ${response.status}`
        );

        toast(
          `Failed to ${action} torrent (${response.status})`
        );

        return;
      }

      try {
        if (action === 'remove') {
          const cleanup = await fetch(
            `${serverBaseUrl}/torrents/cleanup`,
            {
              method: 'post',
              body: JSON.stringify({
                torrent_id: torrent.id,
                name: torrent.name,
                files: getTorrentSoftDeletedFiles(torrent),
              }),
              headers: json_header,
            }
          );

          if (!cleanup.ok) {
            const data = await cleanup.json();
            const failed = data.failed;

            toast(
              `${torrent.name} deleted, some files were not deleted, ${failed.join(', ')}`
            );

            return;
          }
        }

        toast(`${torrent.name} ${action} completed`);

        if (action === 'remove') {
          playSound('sounds/torrent-success.mp3');
        }

        if (action === 'delete') {
          playSound('sounds/torrent-trash.mp3');
        }
      } catch {
        toast(`${torrent.name} cleanup failed.`);
      } finally {
        clearSoftDeleted(torrent);
      }
    } catch (error) {
      const correctedAction = action.substring(
        0,
        action.length - 1
      );

      console.log(
        `Error ${correctedAction}ing torrent:`,
        error
      );

      toast(`Failed to ${action} torrent`);
    }
  };

  const executeDownloadedFileAction = async (
    action: DestructiveDownloadedFileAction,
    downloadedFile: string,
    options?: Record<string, string>
  ) => {
    const encodedDownloadedFileName =
      encodeURIComponent(downloadedFile);

    try {
      const opts = {
        headers: {
          ...json_header,
          ...options,
        },
      };

      const response = await fetch(
        `${serverBaseUrl}/torrents/${action}?filename=${encodedDownloadedFileName}`,
        opts
      );

      if (!response.ok) {
        console.log(
          `Network error performing file action: ${response.status}`
        );

        toast(
          `Failed to ${action} ${downloadedFile} (${response.status})`
        );

        return;
      }

      toast(`${downloadedFile} ${action} completed`);

      if (action.includes('delete')) {
        playSound('sounds/torrent-trash.mp3');
      }

      if (action.includes('move')) {
        playSound('sounds/file-move.mp3');
      }
    } catch (error) {
      console.log(
        `Error performing ${action} on ${downloadedFile}:`,
        error
      );

      toast(
        `Failed to perform ${action} on ${downloadedFile}`
      );
    }
  };

  const cancelRenameTorrent = () => {
    resetState();
    setRenameDialogOpen(false);
  };

  const handleAction = async (
    item: Torrent | string,
    action:
      | DestructiveTorrentAction
      | DestructiveDownloadedFileAction,
    options?: Record<string, string>
  ) => {
    if (typeof item === 'string') {
      await executeDownloadedFileAction(
        action as DestructiveDownloadedFileAction,
        item,
        options
      );

      fetchTorrents();
      return;
    }

    if (typeof item === 'object' && item.id) {
      console.log(
        `Torrent Action: ${action} ... ${item.name}`
      );

      await executeTorrentAction(
        action as DestructiveTorrentAction,
        item
      );

      fetchTorrents();
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedTorrent((current) =>
      current === id ? null : id
    );
  };

  const resetState = () => {
    suggestionsRequestId.current += 1;

    setCurrentDownloadedFile(null);
    setCurrentTorrent(null);
    setCurrentTorrentFilename(null);
    setNewName('');
    setSuggestions(new Set());
  };

  const handleRenameDownloaded = (item: string) => {
    resetState();

    setCurrentDownloadedFile(item);
    setNewName(item);
    setRenameDialogOpen(true);
  };

  const handleRenameTorrent = (
    item: Torrent,
    filename?: string
  ) => {
    resetState();

    setCurrentTorrent(item);

    if (filename) {
      setCurrentTorrentFilename(filename);
      setNewName(filename);
    } else {
      setNewName(item.name);
    }

    setRenameDialogOpen(true);
  };

  const isSoftDeleted = (
    hash: string,
    index: number
  ) =>
    torrentSoftDeletedFiles.some(
      (entry: SoftDeletedFileType) =>
        entry.torrent === hash &&
        entry.fileIndex === index
    );

  const softDeleteTorrentSubFile = (
    torrent: Torrent,
    filename: string
  ) => {
    const index = torrent.files.findIndex(
      (file) => file[0] === filename
    );

    const hash = torrent.id;

    if (!isSoftDeleted(hash, index)) {
      setTorrentSoftDeletedFiles([
        ...torrentSoftDeletedFiles,
        new SoftDeletedFile(hash, index),
      ]);
    }

    playSound('sounds/torrent-trash.mp3');
  };

  const getTorrentSoftDeletedFiles = (
    torrent: Torrent
  ): string[] => {
    const indexes = torrentSoftDeletedFiles
      .filter(
        (entry: SoftDeletedFileType) =>
          entry.torrent === torrent.id
      )
      .map((entry) => entry.fileIndex);

    return torrent.files
      .filter((_, index) => indexes.includes(index))
      .map((entry) => entry[0]);
  };

  const clearSoftDeleted = (torrent: Torrent) => {
    setTorrentSoftDeletedFiles(
      torrentSoftDeletedFiles.filter(
        (entry: SoftDeletedFile) =>
          entry.torrent !== torrent.id
      )
    );
  };

  const batchRenameTorrentFiles = async (
    torrent: Torrent,
    renames: FileRenameType[]
  ) => {
    const payload = {
      torrent_id: torrent.id,
      renames,
    };

    try {
      const response = await fetch(
        `${serverBaseUrl}/torrents/active/files/rename`,
        {
          method: 'POST',
          headers: json_header,
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const json = await response.json();

        if (json.errors.length === 0) {
          toast('Renamed torrent files');
        } else {
          toast(
            'Renamed torrent files with errors'
          );

          console.error(
            'Renaming Torrent Files...'
          );

          json.errors.forEach((error: string) =>
            console.error(error)
          );
        }
      }
    } catch {
      toast('Network error on batch rename');
    }
  };

  const addMagnet = async (magnetUrl: string) => {
    const postUrl =
      `${serverBaseUrl}/torrents/magnet/new`;

    const magnetRegex =
      /magnet:\?xt=urn\:btih:[a-zA-Z0-9]{32,40}(&.+)?$/;

    if (!magnetRegex.test(magnetUrl)) {
      toast('Invalid Magnet URL');
      return;
    }

    try {
      const response = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          magnet_url: magnetUrl,
        }),
      });

      if (!response.ok) {
        toast('Error Failed to Add Magnet Link');
        return;
      }

      playSound('sounds/torrent-add.mp3');
    } catch {
      toast('Network Error Adding Magnet Link');
    }
  };

  const renameTorrent = async (
    torrent: Torrent,
    currentFilename: string,
    newName: string
  ) => {
    const payload = {
      filename: currentFilename,
      newname: newName,
      torrent_id: torrent.id,
    };

    try {
      const response = await fetch(
        `${serverBaseUrl}/torrents/active/rename`,
        {
          method: 'POST',
          headers: json_header,
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        toast(
          `Renamed ${currentFilename} ⇢ ${newName}`
        );
      } else {
        const json = await response.json();

        if (json.detail) {
          toast.warning(json.detail);
        } else {
          toast.warning(
            `Failed to rename ${currentFilename} (${response.status})`
          );
        }
      }
    } catch (error) {
      console.error(
        'Error renaming torrent:',
        error
      );

      toast('Failed to rename torrent');
    } finally {
      fetchTorrents();
    }
  };

  return (
    <TransmissionContext.Provider
      value={{
        torrents,
        sortedTorrents,
        toggleSort,
        downloadedFiles,
        connectionError,

        getActiveFilenames,
        getActiveFiles,
        getShowFilenames,
        getVideoFilenames,
        getShowVideoFilenames,
        getShowSubtitleFilenames,
        getFilenames,
        isTVShowSeasonTorrent,
        canRename,

        fetchTorrents,

        softDeleteTorrentSubFile,
        isSoftDeleted,
        getTorrentSoftDeletedFiles,
        clearSoftDeleted,

        handleAction,
        handleRenameDownloaded,
        confirmRenameDownloadedFile,
        handleRenameTorrent,
        confirmRename,
        renameTorrent,
        batchRenameTorrentFiles,
        cancelRenameTorrent,
        resetState,

        toggleExpand,
        expandedTorrent,
        setExpandedTorrent,

        renameDialogOpen,
        setRenameDialogOpen,

        showTVShowRenameDialog,
        setShowTVShowRenameDialog,

        currentTorrent,
        setCurrentTorrent,

        currentTorrentFilename,
        setCurrentTorrentFilename,

        currentDownloadedFile,
        setCurrentDownloadedFile,

        newName,
        setNewName,

        suggestions,
        setSuggestions,

        autoTitleVideos,

        selectedTorrents,
        setSelectedTorrents,
        executeSelectedTorrentsAction,

        addMagnet,
      }}
    >
      {children}
    </TransmissionContext.Provider>
  );
};
