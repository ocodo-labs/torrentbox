import { useTransmissionContext } from "@/contexts/transmission-provider";
import {
  type DestructiveDownloadedFileAction,
  type DestructiveTorrentAction,
} from "@/types/actions";
import type { Torrent } from "@/types/torrent";
import { type FC, useState } from "react";
import { TVShowToStorage } from "@/components/downloaded/tv-show-to-storage";
import { MusicToStorage } from "@/components/downloaded/music-to-storage";
import { SoftwareToStorage } from "@/components/downloaded/software-to-storage";
import { BookToStorage } from "@/components/downloaded/books-to-storage";
import { MoviesToStorage } from "@/components/downloaded/movies-to-storage";
import { RenameDownloaded } from "@/components/downloaded/rename-downloaded";
import { ShowMorePlaces } from "@/components/downloaded/show-more-places";
import { HideMorePlaces } from "@/components/downloaded/hide-more-places";
import { DeleteDownloaded } from "@/components/downloaded/delete-downloaded";
import { AudiobookToStorage } from "@/components/downloaded/audiobook-to-storage";

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
              <BookToStorage file={file} />
              <AudiobookToStorage file={file} />
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

