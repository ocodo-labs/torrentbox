import { toast } from 'sonner';
import React, { createContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of a downloaded file
interface DownloadedFile {
    path: string;
    mtime: number;
}

// Define the shape of the context state
interface DownloadedFilesContextType {
    files: DownloadedFile[];
    loading: boolean;
    errors: string[];
    fetchFiles: () => Promise<void>;
    clearErrors: () => void;
    deleteFile: (fileName: string) => Promise<void>;
    renameFile: (fileName: string, newName: string) => Promise<void>;
    moveFile: (fileId: string, targetPath: string) => Promise<void>;
}

// Create the context
const DownloadedFilesContext = createContext<DownloadedFilesContextType | undefined>(undefined);
const API_URL = 'http://10.0.0.2:8000/api/files';

interface DownloadedFilesProviderProps {
    children: ReactNode;
}

const DownloadedFilesProvider: React.FC<DownloadedFilesProviderProps> = ({ children }) => {
    const [files, setFiles] = useState<DownloadedFile[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<string[]>([]);

    // Fetch all downloaded files
    const fetchFiles = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                toast(`Network Error`)
            } else {
                const data = await response.json();
                setFiles(data);
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

    // Delete a file
    const deleteFile = async (fileId: string) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}`, {
                method: 'DELETE',
                body: JSON.stringify({ name: fileId })
            });
            if (!response.ok) {
                const errorMsg = await response.text();
                setErrors(prevErrors => [...prevErrors, errorMsg]);
            } else {
                setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
            }
        } catch (error) {
            setErrors(prevErrors => [...prevErrors, (error as Error).message]);
        } finally {
            setLoading(false);
        }
    };

    // Rename a file
    const renameFile = async (fileId: string, newName: string) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: newName }),
            });
            if (!response.ok) {
                const errorMsg = await response.text();
                setErrors(prevErrors => [...prevErrors, errorMsg]);
            } else {
                fetchFiles(); // Refresh the list of files
            }
        } catch (error) {
            setErrors(prevErrors => [...prevErrors, (error as Error).message]);
        } finally {
            setLoading(false);
        }
    };

    // Move a file to a target path
    const moveFile = async (fileId: string, targetPath: string) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/move`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: fileId, targetPath }),
            });
            if (!response.ok) {
                const errorMsg = await response.text();
                setErrors(prevErrors => [...prevErrors, errorMsg]);
            } else {
                fetchFiles(); // Refresh the list of files
            }
        } catch (error) {
            setErrors(prevErrors => [...prevErrors, (error as Error).message]);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchFiles();
    }, []);

    return (
        <DownloadedFilesContext.Provider value={{
            files,
            fetchFiles,
            loading,
            errors,
            clearErrors,
            deleteFile,
            renameFile,
            moveFile
        }}>
            {children}
        </DownloadedFilesContext.Provider>
    );
};

export { DownloadedFilesContext, DownloadedFilesProvider };
