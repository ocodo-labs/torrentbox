import { TooltipButton, TooltipCompact } from "@/components/float-button";
import prettyBytes from 'pretty-bytes'
import {
  AsycJobLongPressTooltipButton,
  LongPressTooltipButton,
} from "@/components/long-press-float-button";
import { TorrentFileRow } from "@/components/torrent-file-row";
import { Progress } from "@/components/ui/progress";
import { useTransmissionContext } from "@/contexts/transmission-provider";
import { thinIconStyle } from "@/lib/styling";
import { Torrent } from "@/types/torrent";
import { ChevronDown, ChevronUp, Edit, Trash, X } from "lucide-react";
import type { FC } from "react";

interface TorrentRowProps {
  torrent: Torrent;
}

const TorrentRow:FC<TorrentRowProps> = ({torrent}) => {
  const {
    isTVShowSeasonTorrent,
    setShowTVShowRenameDialog,
    handleRenameTorrent,
    handleAction,
    toggleExpand,
    expandedTorrent,
    isSoftDeleted,
    canRename,
  } = useTransmissionContext();

  return (
    <div
      key={torrent.id}
      className="p-4 border border-foreground/20 rounded-lg"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
        <div className="text-lg font-semibold mb-2 sm:mb-0 truncate">
          <TooltipCompact tooltipChildren={
            `${torrent.percent}% ${prettyBytes(torrent.speed)}/s`
          }>
            {torrent.name}
          </TooltipCompact>
        </div>
        <div className="flex flex-row items-center gap-2 ">
          {canRename(torrent) && isTVShowSeasonTorrent(torrent) && (
            <TooltipButton
              onClick={() => setShowTVShowRenameDialog(true)}
              title="Rename Show Files"
              icon={
                <Edit
                  className="h-4 w-4 cursor-pointer"
                  style={thinIconStyle}
                />
              }
            />
          )}
          {canRename(torrent) && (
            <TooltipButton
              onClick={() => handleRenameTorrent(torrent)}
              title="Rename"
              icon={
                <Edit
                  className="h-4 w-4 cursor-pointer"
                  style={thinIconStyle}
                />
              }
            />
          )}
          {canRename(torrent) && (
            <LongPressTooltipButton
              onLongPress={() => handleAction(torrent, "remove")}
              title="Remove Torrent"
              fillColor="bg-primary"
              icon={
                <X
                  className="h-4 w-4 cursor-pointer"
                  style={thinIconStyle}
                />
              }
            />
          )}
          <AsycJobLongPressTooltipButton
            title="Delete Torrent"
            icon={
              <Trash className="h-4 w-4 cursor-pointer" style={thinIconStyle} />
            }
            onLongPress={() => handleAction(torrent, "delete")}
          />
          {torrent.files.length > 1 ? (
            <TooltipButton
              hAlign="left"
              vAlign="middle"
              title={`${expandedTorrent === torrent.id ? "Hide" : "Show"
                } Torrent Files`}
              icon={
                expandedTorrent === torrent.id ? (
                  <ChevronUp
                    className="h-4 w-4 cursor-pointer"
                    style={thinIconStyle}
                  />
                ) : (
                  <ChevronDown
                    className="h-4 w-4 cursor-pointer"
                    style={thinIconStyle}
                  />
                )
              }
              onClick={() => toggleExpand(torrent.id)}
            />
          ) : (
            ""
          )}
        </div>
      </div>
      <Progress value={torrent.percent} className="w-full" />
      {expandedTorrent === torrent.id && (
        <div className="mt-4 overflow-x-auto">
          {torrent.files
            .filter((_, index) => !isSoftDeleted(torrent.id, index))
            .map(([filename, size, downloaded], index) => (
              <TorrentFileRow
                key={index}
                torrent={torrent}
                filename={filename}
                size={size}
                downloaded={downloaded}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export { TorrentRow };
