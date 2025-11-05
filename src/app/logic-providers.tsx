import { PinnedQueriesProvider } from "@/contexts/pinned-queries-provider";
import { ServerConfigProvider } from "@/contexts/server-config-provider";
import { TorrentSearchProvider } from "@/contexts/torrent-search-provider";
import { TransmissionProvider } from "@/contexts/transmission-provider";

export const LogicProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ServerConfigProvider>
      <TransmissionProvider>
        <PinnedQueriesProvider>
          <TorrentSearchProvider>
            {children}
          </TorrentSearchProvider>
        </PinnedQueriesProvider>
      </TransmissionProvider>
    </ServerConfigProvider>
  );
}
