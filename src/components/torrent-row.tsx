import { TooltipButton, TooltipCompact } from "@/components/tooltip-compact";
import prettyBytes from 'pretty-bytes'
import {
  LongPressTooltipButton,
} from "@/components/long-press-tooltip-button";
import { LongPressAsyncJobTooltipButton } from "./async-job-long-press-tooltip-button";
import { TorrentFileRow } from "@/components/torrent-file-row";
import { Progress } from "@/components/ui/progress";
import { useTransmissionContext } from "@/contexts/transmission-provider";
import { thinIconStyle } from "@/lib/styling";
import { type Torrent } from "@/types/torrent";
import { ChevronDown, ChevronUp, Edit, Trash, Tv2, Type, X } from "lucide-react";
import { useState, type FC } from "react";
import { playSound } from "@/lib/play-sound";
import { RenameTVShowView } from "@/components/rename-tvshow-view";

interface TorrentRowProps {
  torrent: Torrent;
}

export const TorrentRow: FC<TorrentRowProps> = ({ torrent }) => {
  const {
    isTVShowSeasonTorrent,
    getActiveFiles,
    handleRenameTorrent,
    handleAction,
    toggleExpand,
    clearSoftDeleted,
    setCurrentTorrent,
    canRename,
    autoTitleVideos,
    expandedTorrent,
    selectedTorrents,
    setSelectedTorrents,
  } = useTransmissionContext();

  const [showRenameView, setShowRenameView] = useState(false)

  const hasTitleableVideo = ['mp4', 'mkv']
    .map((i) =>
      torrent
        .files
        .filter((e) => e[0]
          .endsWith(i)))
    .length > 0

  const complete = torrent.percent == 100

  const handleSelectedTorrentsToggle = (id: string) => {
    if (selectedTorrents.has(id)) {
      selectedTorrents.delete(id)
      setSelectedTorrents(new Set(selectedTorrents))
    } else {
      selectedTorrents.add(id)
      setSelectedTorrents(new Set(selectedTorrents))
    }
  }

  return (
    <div
      key={torrent.id}
      onDoubleClick={() => {
        handleSelectedTorrentsToggle(torrent.id)
      }}
      className={`p-4 border border-foreground/20 rounded-lg
        ${selectedTorrents.has(torrent.id) ? 'border-primary' : ''}
        `}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
        <div className="text-lg font-semibold mb-2 sm:mb-0 truncate">
          <TooltipCompact tooltipChildren={

            torrent.percent > 0 &&
            <div className="flex flex-row gap-2 select-none">
              <div>
                {torrent.percent}% {prettyBytes(torrent.speed)}/s of {prettyBytes(torrent.total)}
              </div>
              <div className="text-xxs rounded-sm bg-background/50 p-1 px-2">
                {torrent.stats
                  .filter((s) => Boolean(s.fields.seederCount))
                  .sort((a, b) => a.fields.seederCount > b.fields.seederCount ? -1 : 1)[0]
                  ?.fields?.seederCount
                } seeds
              </div>
              <div className="text-xxs rounded-sm bg-background/50 p-1 px-2">
                {torrent.stats
                  .filter((s) => Boolean(s.fields.leecherCount))
                  .sort((a, b) => a.fields.leecherCount > b.fields.leecherCount ? -1 : 1)[0]
                  ?.fields?.leecherCount

                } leechers
              </div>
              <div className="text-xxs rounded-sm bg-background/50 p-1 px-2">
                {torrent.stats
                  .filter((s) => s.fields.downloadCount)
                  .sort((a, b) => a.fields.downloadCount > b.fields.downloadCount ? -1 : 1)[0]
                  ?.fields?.downloadCount

                } downloads
              </div>
            </div>

          }>
            {torrent.name}
          </TooltipCompact>
        </div>
        <div className="flex flex-row items-center gap-2 ">
          {hasTitleableVideo && complete &&
            <LongPressAsyncJobTooltipButton
              title="Auto title videos"
              fillColor="bg-primary"
              icon={
                <Type
                  className="h-4 w-4 cursor-pointer"
                  style={thinIconStyle}
                />
              }
              onLongPress={() => autoTitleVideos(torrent)}
            />}
          {canRename(torrent) && isTVShowSeasonTorrent(torrent) && (
            <TooltipButton
              className={showRenameView ? `bg-primary/80` : ''}
              onClick={() => {
                setCurrentTorrent(torrent)
                setShowRenameView(!showRenameView)
              }}
              title="Rename Show Files"
              icon={
                <Tv2
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
          <LongPressAsyncJobTooltipButton
            title="Delete Torrent"
            icon={
              <Trash className="h-4 w-4 cursor-pointer" style={thinIconStyle} />
            }
            onLongPress={async () => {
              playSound("sounds/torrent-trash.mp3")
              clearSoftDeleted(torrent)
              return handleAction(torrent, "delete")
            }}
          />
          {torrent.files.length > 1 ? (
            <TooltipButton
              className={expandedTorrent === torrent.id ? "bg-primary/80" : ""}
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
      {showRenameView && expandedTorrent === null &&
        <RenameTVShowView torrent={torrent} />
      }
      <Progress value={torrent.percent} className="w-full" />
      {expandedTorrent === torrent.id && (
        <div className="mt-4 overflow-x-auto">
          {getActiveFiles(torrent).map(([filename, size, downloaded], index) => (
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

