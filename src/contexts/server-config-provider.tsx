import type { ConfigModel } from "@/lib/server-config";
import { createContext, useContext, useState, type FC, type ReactNode } from "react";
import { toast } from "sonner";

export interface ServerConfigContextType {
  config: ConfigModel
  setConfig: (newValue: ConfigModel) => void
  fetchConfig: () => Promise<void>
  saveConfig: () => Promise<void>
  isOpen: boolean
  open: () => void
  close: () => void
  loading: boolean
  error: string | null
}

export const ServerConfigContext = createContext<ServerConfigContextType>({} as ServerConfigContextType);

export const useServerConfig = (): ServerConfigContextType => {
  const context = useContext(ServerConfigContext);
  if (!context) {
    throw new Error('useServerConfig must be used within a ServerConfigProvider');
  }
  return context;
};

export const ServerConfigProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ConfigModel>({} as ConfigModel)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = () => {
    setIsOpen(true);
    fetchConfig();
  };

  const close = () => {
    setIsOpen(false);
    setError(null);
  };

  const fetchConfig = async () => {
    setLoading(true)
    const response = await fetch('/api/config')
    if (response.ok) {
      setConfig(await response.json())
      setLoading(false)
      toast('Settings loaded')
    } else {
      setError('Failed to get server config')
    }

  }

  const saveConfig = async () => {
    fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    })
  }

  return (
    <ServerConfigContext.Provider value={{
      config,
      setConfig,
      fetchConfig,
      saveConfig,
      isOpen,
      open,
      close,
      loading,
      error,
    }}>
      {children}
    </ServerConfigContext.Provider>
  )
}
