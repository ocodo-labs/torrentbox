import { AsycJobLongPressTooltipButton } from "@/components/long-press-tooltip-button";
import { TooltipCompact } from "@/components/tooltip-compact";
import { Input } from "@/components/ui/input";
import { useTransmissionContext } from "@/contexts/transmission-provider";
import { playSound } from "@/lib/play-sound";
import { thinIconStyle } from "@/lib/styling";
import { cn } from "@/lib/utils";
import type { Torrent } from "@/types/torrent";
import { CircleCheckBig, RegexIcon } from "lucide-react";
import { useState, type FC } from "react";

export const RenameTVShowView: FC<{ torrent: Torrent }> = ({ torrent }) => {

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
        {
          pattern != "" && !hasDupes && changed.length > 0
          && (
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