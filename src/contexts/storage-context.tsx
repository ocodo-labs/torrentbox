import { StorageContext, type StorageContextType } from "@/contexts/storage-provider";
import { useContext } from "react";

export const useStorage = (): StorageContextType => {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};
