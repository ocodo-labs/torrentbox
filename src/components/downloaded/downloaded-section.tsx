import { useTransmissionContext } from "@/contexts/transmission-provider";
import {
  type DestructiveDownloadedFileAction,
  type DestructiveTorrentAction,
} from "@/types/actions";
import type { Torrent } from "@/types/torrent";
import { type FC, useState } from "react";
import { TVShowToStorage } from "./tv-show-to-storage";
import { MusicToStorage } from "./music-to-storage";
import { SoftwareToStorage } from "./software-to-storage";
import { BooksToStorage } from "./books-to-storage";
import { MoviesToStorage } from "./movies-to-storage";
import { RenameDownloaded } from "./rename-downloaded";
import { ShowMorePlaces } from "./show-more-places";
import { HideMorePlaces } from "./hide-more-places";
import { DeleteDownloaded } from "./delete-downloaded";

export const DownloadedSection: FC = () => {
  const { handleAction, handleRenameDownloaded, downloadedFiles } =
    useTransmissionContext();

  if (downloadedFiles.length > 0) {
    return (
      <section>
        <h2 className="text-xl font-semibold mb-4">Downloaded</h2>
        <div className="space-y-4">
          {downloadedFiles.map((file: string, index: number) => (
            <DownloadedFileRow
              key={index}
              file={file}
              handleAction={handleAction}
              handleRename={handleRenameDownloaded}
            />
          ))}
        </div>
      </section>
    );
  } else {
    return null;
  }
};

interface DownloadedFileRowProps {
  file: string;
  handleRename: (item: string, filename?: string) => void;
  handleAction: (
    torrent: Torrent | string,
    action: DestructiveTorrentAction | DestructiveDownloadedFileAction
  ) => Promise<void>;
}

export const DownloadedFileRow: FC<DownloadedFileRowProps> = ({file}) => {
  const [showMore, setShowMore] = useState<boolean>(false);

  return (
    <div className="p-4 border border-foreground/10 dark:border-foreground/5 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
        <div className="text-lg font-semibold mb-2 sm:mb-0">{file}</div>
        <div className="flex flex-row gap-2 items-center justify-start">
          <>
            <RenameDownloaded file={file} />
            <TVShowToStorage file={file} />
            <MoviesToStorage file={file} />
          </>
          {!showMore && (
            <ShowMorePlaces onClick={() => setShowMore(true)} />
          )}
          {showMore && (
            <>
              <HideMorePlaces onClick={() => setShowMore(false)} />
              <BooksToStorage file={file} />
              <MusicToStorage file={file} />
              <SoftwareToStorage file={file} />
            </>
          )}
          <DeleteDownloaded file={file} />
        </div>
      </div>
    </div>
  );
};

