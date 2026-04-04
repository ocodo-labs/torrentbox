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
import { useState, type FC } from "react";

import type { DestructiveDownloadedFileAction, DestructiveTorrentAction } from "@/types/actions";
import type { MoveType, Torrent } from "@/types/torrent";

export interface DownloadedFileRowProps {
  file: string;
  handleRename: (item: string, filename?: string) => void;
  handleAction: (
    torrent: Torrent | string,
    action: DestructiveTorrentAction | DestructiveDownloadedFileAction
  ) => Promise<void>;
}

export const DownloadedFileRow: FC<DownloadedFileRowProps> = ({ file }) => {
  const [showMore, setShowMore] = useState<boolean>(false);
  const [fileMoving, setFileMoving] = useState<boolean>(false);
  const [moveType, setMoveType] = useState<MoveType>(undefined);

  const moveButtonProps = { setMoveType, moveType, fileMoving, setFileMoving, file }

  return (
    <div className="p-4 border border-foreground/10 dark:border-foreground/5 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
        <div className="text-lg font-semibold mb-2 sm:mb-0">{file}</div>
        <div className="flex flex-row gap-2 items-center justify-start">
          <>
            {!fileMoving && <RenameDownloaded file={file} />}
            <TVShowToStorage {...moveButtonProps} />
            <MoviesToStorage {...moveButtonProps} />
          </>
          {!showMore && !fileMoving && (
            <ShowMorePlaces onClick={() => setShowMore(true)} />
          )}
          {showMore && (
            <>
              {!fileMoving && <HideMorePlaces onClick={() => setShowMore(false)} />}
              <BookToStorage {...moveButtonProps} />
              <AudiobookToStorage {...moveButtonProps} />
              <MusicToStorage {...moveButtonProps} />
              <SoftwareToStorage {...moveButtonProps} />
            </>
          )}
          {!fileMoving && <DeleteDownloaded file={file} />}
        </div>
      </div>
    </div>
  );
};

