import { LongPressAsyncJobTooltipButton } from "./async-job-long-press-tooltip-button";
import { TooltipCompact } from "@/components/tooltip-compact";
import { Input } from "@/components/ui/input";
import { useTransmissionContext } from "@/contexts/transmission-provider";
import { playSound } from "@/lib/play-sound";
import { cn } from "@/lib/utils";
import type { Torrent } from "@/types/torrent";
import { RegexIcon, ReplaceAllIcon, ReplaceIcon } from "lucide-react";
import { useEffect, useState, type FC } from "react";
import { suggestRename } from "@/lib/rename/om-rename-engine";

interface FileEntry {
  filename: string;
  basename: string;
  basenameNoExt: string;
  replaced: string;
  ext: string | undefined;
}

type FileEntries = FileEntry[]

export const RenameTVShowView: FC<{ torrent: Torrent }> = ({ torrent }) => {

  const { getShowVideoFilenames, batchRenameTorrentFiles } = useTransmissionContext();

  const [isRegex, setIsRegex] = useState(false);
  const [isRepeated, setIsRepeated] = useState(false);
  const [pattern, setPattern] = useState("");
  const [replacement, setReplacement] = useState("");
  const [replacements, setReplacements] = useState<string[]>([]);
  const [entries, setEntries] = useState<FileEntries>([]);
  const [changed, setChanged] = useState<FileEntries>([]);
  const [hasDupes, setHasDupes] = useState<boolean>(false);

  const autoSuggestions = () => {
    const videoFilenames: FileEntries = getShowVideoFilenames(torrent).map(
      filename => {
        const basename = filename.replace(`${torrent.name}/`, '');
        const ext = basename.split('.').pop();
        const basenameNoExt = basename.replace(`.${ext}`, '');
        const replaced = suggestRename(basenameNoExt)[0].name;
        return { filename, basename, basenameNoExt, replaced, ext };
      }
    )
    setEntries(videoFilenames);
  }

  useEffect(() => {
    const videoFilenames: FileEntries = getShowVideoFilenames(torrent).map(
      filename => {
        const basename = filename.replace(`${torrent.name}/`, '');
        const ext = basename.split('.').pop();
        const basenameNoExt = basename.replace(`.${ext}`, '');

        let replaced = isRepeated
          ? basenameNoExt.replaceAll(pattern, replacement)
          : basenameNoExt.replace(pattern, replacement);

        if (isRegex) {
          try {
            replaced = basenameNoExt.replace(new RegExp(pattern), replacement);
          } catch {
            // ignore regex errors
          }
        }
        return { filename, basename, basenameNoExt, replaced, ext };
      }
    )

    setEntries(videoFilenames)
  }, []);

  useEffect(() => {
    setReplacements(entries.map(e => e.replaced))
    setChanged(entries.filter(e => e.replaced != e.basenameNoExt))
  }, [entries])

  useEffect(() => {
    setHasDupes(Array.from(new Set(replacements)).length != replacements.length)
  }, [replacements])

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
            className={cn(
              "bg-background/70 absolute right-1 top-1 p-1 px-3 rounded-full flex flex-row gap-2"
            )}>
            <TooltipCompact tooltipChildren={isRegex ? "Regex On" : "Regex Off"}>
              <RegexIcon className={
                cn(
                  "w-3 h-3 cursor-pointer text-foreground/50",
                  isRegex && "text-foreground")
              }
                onClick={() => setIsRegex(!isRegex)}
              />
            </TooltipCompact>
            <TooltipCompact tooltipChildren={isRepeated ? "Replace All" : "Replace One"}>
              {isRepeated
                ? <ReplaceAllIcon
                  className={cn("w-3 h-3 cursor-pointer text-foreground/90")}
                  onClick={() => setIsRepeated(!isRepeated)} />
                : <ReplaceIcon
                  className={cn("w-3 h-3 cursor-pointer text-foreground/50")}
                  onClick={() => setIsRepeated(!isRepeated)} />
              }
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
            <LongPressAsyncJobTooltipButton
              className="bg-emerald-800 text-white hover:bg-emerald-700"
              fillColor="bg-primary"
              title="Apply Rename"
              icon={
                <div
                  className="cursor-pointer px-3"

                >Rename</div>
              }
              onLongPress={async () => {
                batchRenameTorrentFiles(torrent, batchRenamePayload)
                return playSound("sounds/torrent-success.mp3")
              }}
            />
          )
        }

        <div>or</div>

        <LongPressAsyncJobTooltipButton
          className="bg-emerald-800 text-white hover:bg-emerald-700"
          title="Auto Rename"
          onLongPress={() => {
            autoSuggestions();
            batchRenameTorrentFiles(torrent, batchRenamePayload)
            return playSound("sounds/torrent-success.mp3")
          }}
          icon={
            <div
              className="px-3 cursor-pointer"
              onClick={() => autoSuggestions()}
            >
              Auto Rename
            </div>
          }
        />

      </div>
      {
        entries.map(
          entry => {
            const { basename, ext, replaced } = entry
            return (
              <div className={
                `
              grid grid-cols-2
              items-center justify-between
              p-2
              bg-foreground/10
              overflow-x-auto
              border-b-1 border-foreground/20
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
