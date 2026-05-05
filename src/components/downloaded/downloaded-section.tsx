import { DownloadedFileRow } from "@/components/downloaded/downloaded-file-row";
import { useTransmissionContext } from "@/contexts/transmission-provider";
import { type FC } from "react";

export const DownloadedSection: FC = () => {
  const { handleAction, handleRenameDownloaded, downloadedFiles } =
    useTransmissionContext();

  if (downloadedFiles.length > 0) {
    return (
      <section>
        <h2 className="text-xl font-semibold mb-4">Downloaded</h2>
        <div className="space-y-4">
          {
            downloadedFiles.map((file: string) => (
              <DownloadedFileRow
                key={file}
                file={file}
                handleAction={handleAction}
                handleRename={handleRenameDownloaded}
              />
            ))
          }
        </div>
      </section>
    );
  } else {
    return null;
  }
};
