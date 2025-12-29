import { ExternalLinkProvider } from "@/contexts/external-link-provider";
import { StorageProvider } from "@/contexts/storage-provider";

export const ListingProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <StorageProvider>
      <ExternalLinkProvider>
        {children}
      </ExternalLinkProvider>
    </StorageProvider>
  );
};
