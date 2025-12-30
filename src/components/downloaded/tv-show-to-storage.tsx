import { StoragePathSelect } from "@/components/downloaded/storage-path-select"
import { TooltipCompact } from "@/components/tooltip-compact"
import { useStorage } from "@/contexts/storage-context"
import type { StorageNamePath } from "@/contexts/storage-provider"
import { useTransmissionContext } from "@/contexts/transmission-provider"
import { thinIconStyle } from "@/lib/styling"
import { validateNewShowName } from "@/lib/tv-show-validation"
import { cn } from "@/lib/utils"
import { CircleX, Tv } from "lucide-react"
import type { FC } from "react"
import { useState } from "react"
import { toast } from "sonner"

export const TVShowToStorage: FC<{ file: string }> = ({ file }) => {
  const { tvShows, fetchTVShowList } = useStorage();
  const { handleAction } = useTransmissionContext();
  const [showTVShows, setShowTVShows] = useState<boolean>(false);
  const [showAddAsNewShow, setShowAddAsNewShow] = useState<boolean>(false);
  const [currentShow, setCurrentShow] = useState<StorageNamePath>({} as StorageNamePath);
  const [newShowName, setNewShowName] = useState<string>('');
  const [isValidShowName, setIsValidShowName] = useState<boolean>(true);
  const [validationError, setValidationError] = useState<string | undefined>(undefined);

  const handleMoveToCurrentShowClick = () => {
    const seriesPath = currentShow.path;
    setCurrentShow({} as StorageNamePath);
    return handleAction(file, "files/move/tvshows", { 'tvseries': seriesPath });
  };

  const handleNewShowNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewShowName(value);

    const { isValid, error } = validateNewShowName(value, tvShows);
    setIsValidShowName(isValid);
    setValidationError(error);
  };

  const handleShowSelection = (show: StorageNamePath) => {
    if (show.path === '') {
      setShowAddAsNewShow(true);
    } else {
      setCurrentShow(show);
      setShowAddAsNewShow(false);
    }
  };

  const handleSubmitNewShow = () => {
    if (isValidShowName && newShowName.trim() !== '') {
      const newShowPath = `add::${newShowName.trim()}`;
      setCurrentShow({ name: newShowName, path: newShowPath });
      setShowAddAsNewShow(false);
      toast.success(`Adding as ${newShowName}`);
    } else {
      toast.error(validationError || 'Please provide a valid show name.');
    }
  };

  return (
    <>
      <TooltipCompact tooltipChildren="Move to TV Show">
        <div className="rounded-full cursor-pointer p-2 hover:bg-foreground/20">
          {
            !showTVShows
              ?
              <Tv
                className="h-4 w-4"
                style={thinIconStyle}
                onClick={() => {
                  fetchTVShowList();
                  setShowTVShows(true);
                }} />
              :
              <CircleX
                className="h-4 w-4"
                style={thinIconStyle}
                onClick={() => {
                  setShowTVShows(false);
                  setShowAddAsNewShow(false);
                  setCurrentShow({} as StorageNamePath);
                }}
              />
          }
        </div>
      </TooltipCompact>

      {showTVShows && !showAddAsNewShow && !currentShow.name && (
        <StoragePathSelect
          selectLabel="Move to TV show..."
          items={[...tvShows, { name: 'Add new tv show...', path: '' }]}
          onPick={handleShowSelection}
        />
      )}

      {showAddAsNewShow && !currentShow.path && (
        <div
          className={cn(
            "rounded-full bg-primary cursor-pointer text-xs p-1 px-3 transition-colors",
            "focus-within:bg-primary/30 focus-within:border-primary focus-within:border-2"
          )}
        >
          <input
            className="bg-transparent focus:outline-none focus:ring-0"
            value={newShowName}
            onChange={handleNewShowNameChange}
            placeholder="Enter new show name..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmitNewShow();
              }
            }}
          />
        </div>
      )}

      {validationError && !isValidShowName && (
        <p className="text-red-500 text-xs">{validationError}</p>
      )}

      {currentShow.name && !showAddAsNewShow && (
        <div
          className={cn(`rounded-full bg-primary cursor-pointer text-xs p-1 px-3`)}
          onClick={() => currentShow.path ? handleMoveToCurrentShowClick() : handleSubmitNewShow()}
        >
          {currentShow.path ? `Move to ${currentShow.name}` : currentShow.name}
        </div>
      )}

      {!currentShow.name && showAddAsNewShow && (
        <div
          className={cn(`rounded-full bg-primary cursor-pointer text-xs p-1 px-3`)}
          onClick={handleSubmitNewShow}
        >
          Add Show...
        </div>
      )}
    </>
  );
};
