import { toast } from '@/hooks/use-toast';
import React, { createContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of a Torrent object
interface Torrent {
    id: number;
    name: string;
    sizeWhenDone: number;
    downloadedEver: number;
    peersGettingFromUs: number;
    peersConnected: number;
    percentDone: number;
}

// Define the shape of the context state
interface TorrentsContextType {
    torrents: Torrent[];
    loading: boolean;
    errors: string[];
    clearErrors: () => void;
    addTorrent: (torrentUrl: string) => Promise<void>;
    removeTorrent: (torrentId: number) => Promise<void>;
    deleteAndRemoveTorrent: (torrentId: number) => Promise<void>;
    renameTorrent: (torrentId: number, newName: string) => Promise<void>;
    renameTorrentFile: (torrentId: number, originalFullPath: string, newFileName: string) => Promise<void>;
}

// Create the context
const TorrentsContext = createContext<TorrentsContextType | undefined>(undefined);
const TRANSMISSION_API_URL = 'http://localhost:9091/transmission/rpc';

interface TorrentsProviderProps {
    children: ReactNode;
}

const TorrentsProvider: React.FC<TorrentsProviderProps> = ({ children }) => {
    const [torrents, setTorrents] = useState<Torrent[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<string[]>([]);

    // Fetch all torrents
    const fetchTorrents = async () => {
        setLoading(true);
        try {
            const response = await fetch(TRANSMISSION_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    method: 'torrent-get',
                    arguments: {
                        fields: ['id', 'name', 'sizeWhenDone', 'downloadedEver', 'peersGettingFromUs', 'peersConnected', 'percentDone'],
                    },
                }),
            });
            if (!response.ok) {
                toast({ title: `Network Error`})
            } else {
                const data = await response.json();
                setTorrents(data.arguments.torrents);
            }
        } catch (err) {
            setErrors(prevErrors => [...prevErrors, (err as Error).message]);
        } finally {
            setLoading(false);
        }
    };

    // Clear errors
    const clearErrors = () => {
        setErrors([]);
    };

    // Add a new torrent
    const addTorrent = async (torrentUrl: string) => {
        setLoading(true);
        try {
            const response = await fetch(TRANSMISSION_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    method: 'torrent-add',
                    arguments: {
                        filename: torrentUrl,
                    },
                }),
            });
            const data = await response.json();
            if (data.result !== 'success') {
                setErrors(prevErrors => [...prevErrors, data.result]);
            } else {
                fetchTorrents();
            }
        } catch (error) {
            setErrors(prevErrors => [...prevErrors, (error as Error).message]);
        } finally {
            setLoading(false);
        }
    };

    // Remove a torrent
    const removeTorrent = async (torrentId: number) => {
        setLoading(true);
        try {
            const response = await fetch(TRANSMISSION_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    method: 'torrent-remove',
                    arguments: {
                        ids: [torrentId],
                    },
                }),
            });
            const data = await response.json();
            if (data.result !== 'success') {
                setErrors(prevErrors => [...prevErrors, data.result]);
            } else {
                fetchTorrents();
            }
        } catch (error) {
            setErrors(prevErrors => [...prevErrors, (error as Error).message]);
        } finally {
            setLoading(false);
        }
    };

    // Delete a torrent and remove its files
    const deleteAndRemoveTorrent = async (torrentId: number) => {
        setLoading(true);
        try {
            const response = await fetch(TRANSMISSION_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    method: 'torrent-delete',
                    arguments: {
                        ids: [torrentId],
                        deleteData: true,
                    },
                }),
            });
            const data = await response.json();
            if (data.result !== 'success') {
                setErrors(prevErrors => [...prevErrors, data.result]);
            } else {
                fetchTorrents();
            }
        } catch (error) {
            setErrors(prevErrors => [...prevErrors, (error as Error).message]);
        } finally {
            setLoading(false);
        }
    };

    // Rename a torrent
    const renameTorrent = async (torrentId: number, newName: string) => {
        setLoading(true);
        try {
            const response = await fetch(TRANSMISSION_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    method: 'torrent-rename',
                    arguments: {
                        id: torrentId,
                        name: newName,
                    },
                }),
            });
            const data = await response.json();
            if (data.result !== 'success') {
                setErrors(prevErrors => [...prevErrors, data.result]);
            } else {
                fetchTorrents();
            }
        } catch (error) {
            setErrors(prevErrors => [...prevErrors, (error as Error).message]);
        } finally {
            setLoading(false);
        }
    };

    // Rename a file within a torrent
    const renameTorrentFile = async (torrentId: number, originalFullPath: string, newFileName: string) => {
        setLoading(true);
        try {
            const response = await fetch(TRANSMISSION_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    method: 'torrent-rename-path',
                    arguments: {
                        id: torrentId,
                        old: originalFullPath,
                        new: newFileName,
                    },
                }),
            });
            const data = await response.json();
            if (data.result !== 'success') {
                setErrors(prevErrors => [...prevErrors, data.result]);
            } else {
                fetchTorrents();
            }
        } catch (error) {
            setErrors(prevErrors => [...prevErrors, (error as Error).message]);
        } finally {
            setLoading(false);
        }
    };

    // Polling setup
    useEffect(() => {
        fetchTorrents();
        const intervalId = setInterval(fetchTorrents, 5000);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <TorrentsContext.Provider value={{
            torrents,
            loading,
            errors,
            clearErrors,
            addTorrent,
            removeTorrent,
            deleteAndRemoveTorrent,
            renameTorrent,
            renameTorrentFile
        }}>
            {children}
        </TorrentsContext.Provider>
    );
};

export { TorrentsContext, TorrentsProvider };
