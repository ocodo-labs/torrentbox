import { TooltipButton, TooltipCompact } from "@/components/tooltip-compact";
import prettyBytes from 'pretty-bytes'
import {
  AsycJobLongPressTooltipButton,
  LongPressTooltipButton,
} from "@/components/long-press-tooltip-button";
import { TorrentFileRow } from "@/components/torrent-file-row";
import { Progress } from "@/components/ui/progress";
import { useTransmissionContext } from "@/contexts/transmission-provider";
import { thinIconStyle } from "@/lib/styling";
import { Torrent } from "@/types/torrent";
import { ChevronDown, ChevronUp, CircleCheckBig, Edit, RegexIcon, Trash, TriangleAlert, Tv2, X } from "lucide-react";
import { useState, type FC } from "react";
import { playSound } from "@/lib/play-sound";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TorrentRowProps {
  torrent: Torrent;
}

const TorrentRow: FC<TorrentRowProps> = ({ torrent }) => {
  const {
    isTVShowSeasonTorrent,
    getActiveFiles,
    handleRenameTorrent,
    handleAction,
    toggleExpand,
    clearSoftDeleted,
    setCurrentTorrent,
    canRename,
    expandedTorrent,
  } = useTransmissionContext();

  const [showRenameView, setShowRenameView] = useState(false)

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
          <AsycJobLongPressTooltipButton
            title="Delete Torrent"
            icon={
              <Trash className="h-4 w-4 cursor-pointer" style={thinIconStyle} />
            }
            onLongPress={async () => {
              playSound("/sounds/torrent-delete.mp3")
              clearSoftDeleted(torrent)
              return handleAction(torrent, "delete")
            }}
          />
          {torrent.files.length > 1 ? (
            <TooltipButton
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
        <TVShowRenameView torrent={torrent} />
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

const TVShowRenameView: FC<{ torrent: Torrent }> = ({ torrent }) => {

  const { getShowVideoFilenames, batchRenameTorrentFiles } = useTransmissionContext();

  const [isRegex, setIsRegex] = useState(false);
  const [pattern, setPattern] = useState("");
  const [replacement, setReplacement] = useState("");
  const entries = getShowVideoFilenames(torrent).map(
    filename => {
      const basename = filename.replace(`${torrent.name}/`, '')
      const ext = basename.split('.').pop()
      const basenameNoExt = basename.replace(`.${ext}`, '')

      let replaced = basenameNoExt.replace(pattern, replacement)
      if (isRegex) {
        try {
          replaced = basenameNoExt.replace(new RegExp(pattern), replacement)
        } catch {
          // ignore regex errors
        }
      }
      return { filename, basename, basenameNoExt, replaced, ext }
    }
  )

  const replacements = entries.map(e => e.replaced)
  const hasDupes = Array.from(new Set(replacements)).length != replacements.length
  const changed = entries.filter(e => e.replaced != e.basenameNoExt)
  const batchRenamePayload = entries.map(e => {
    return {
      newname: `${e.replaced}.${e.ext}`,
      filename: e.filename
    }
  })

  const getReplacementBlockMessage = () => {
    if (hasDupes) return "Rename error, duplication";
    if (changed.length === 0) return "No names changed";
    return "No rename pattern";
  };

  return (
    <div className="grid grid-cols-1 items-center justify-between  mb-2">
      <div className="flex flex-row gap-4 items-center justify-items-stretch mb-2">
        <div className="text-nowrap">Replace</div>
        <div className="relative">
          <Input
            className="rounded-full border-foreground/20"
            onChange={(e) => setPattern(e.target.value)}
          />
          <div
            onClick={() => setIsRegex(!isRegex)}
            className={cn(
              "bg-background/70 cursor-pointer absolute right-1 top-1 p-1 px-3 rounded-full"
            )}>
            <TooltipCompact tooltipChildren={isRegex ? "Regex On" : "Regex Off"}>
              <RegexIcon className={
                cn(
                  "w-3 h-3 cursor-pointer text-foreground/50",
                  isRegex && "text-foreground")
              } />
            </TooltipCompact>
          </div>
        </div>
        <div className="text-nowrap">With</div>
        <div>
          <Input
            className="rounded-full border-foreground/20"
            onChange={(e) => setReplacement(e.target.value)}
          />
        </div>

        {/* Replace Action Button */}
        {pattern != "" && !hasDupes && changed.length > 0
          ? (
            <AsycJobLongPressTooltipButton
              className="bg-emerald-800 text-white hover:bg-emerald-700"
              fillColor="bg-primary"
              title="Apply Rename"
              icon={
                <CircleCheckBig
                  className="h-4 w-4 cursor-pointer"
                  style={thinIconStyle}
                />
              }
              onLongPress={async () => {
                batchRenameTorrentFiles(torrent, batchRenamePayload)
                return playSound("/sounds/torrent-remove.mp3")
              }}
            />
          )
          : (
            <TooltipCompact tooltipChildren={getReplacementBlockMessage()}>
              <TriangleAlert className="p-2 h-8 w-8 bg-red-900 text-white rounded-full" strokeWidth={1} />
            </TooltipCompact>
          )
        }
      </div>
      {
        entries.map(
          entry => {
            const { basename, ext, replaced } = entry
            return (
              <div className={
                `
              grid
              grid-cols-2
              items-center
              justify-between
              p-2
              bg-foreground/10
              overflow-x-auto
              border-b-1
              border-foreground/20
              `
              }>
                <div>
                  {basename}
                </div>
                {replacements.filter(e => e == replaced).length > 1
                  ? (
                    <div className="text-red-600">
                      {replaced}.{ext}
                    </div>
                  )
                  : (
                    <div className="text-primary">
                      {replaced}.{ext}
                    </div>
                  )
                }
              </div>
            )
          }
        )
      }
    </div >
  )
}

export { TorrentRow };
