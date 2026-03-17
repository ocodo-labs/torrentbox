import React, { useState } from "react"
import type { FC } from "react"
import type { StorageNamePath } from "@/contexts/storage-provider"
import { cn } from "@/lib/utils"
import { StoragePathSelect } from "@/components/downloaded/storage-path-select"
import { TVShowAddAsNewShow } from "@/components/downloaded/tv-show-add-as-new-show"
import { TooltipCompact } from "@/components/tooltip-compact"
import { useStorage } from "@/contexts/storage-context"
import { useTransmissionContext } from "@/contexts/transmission-provider"
import { thinIconStyle } from "@/lib/styling"
import { validateNewShowName } from "@/lib/tv-show-validation"
import { CircleX, Tv } from "lucide-react"
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
    const seriesName = currentShow.name;
    setCurrentShow({} as StorageNamePath);
    return handleAction(file, "files/move/tvshows", { 'X-TVSeries': seriesName });
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

  const addNewShow = async (showName: string, path: string) => {
    toast(
      <div>
        <div>
          file: {file} will be moved to tv shows
        </div>
        <div>
          as: {showName}
        </div>
        <div>
          nested in: {path}
        </div>
      </div>
    )
  }

  const handleSubmitNewShow = async () => {
    if (isValidShowName && newShowName.trim() !== '') {
      const newShowPath = newShowName.trim();
      setCurrentShow({ name: newShowName, path: newShowPath });
      setShowAddAsNewShow(false);
      await addNewShow(newShowName, newShowPath)
      toast.success(`Adding new show: ${newShowName}`)
    } else {
      toast.error(validationError || 'Please provide a valid show name.');
    }
  };

  return (
    <>
      <TooltipCompact tooltipChildren={showTVShows ? "Cancel move to TV Show" : "Move to TV Show"}>
        <div className="rounded-full cursor-pointer p-2 hover:bg-foreground/20">
          {
            !showTVShows
              ?
              <Tv
                onClick={() => {
                  fetchTVShowList();
                  setShowTVShows(true);
                }}
                className="h-4 w-4"
                style={thinIconStyle}
              />
              :
              <CircleX
                onClick={() => {
                  setShowTVShows(false);
                  setShowAddAsNewShow(false);
                  setCurrentShow({} as StorageNamePath);
                }}
                className="h-4 w-4"
                style={thinIconStyle}
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
        <TVShowAddAsNewShow
          newShowName={newShowName}
          handleNewShowNameChange={handleNewShowNameChange}
          handleSubmitNewShow={handleSubmitNewShow}
        />
      )}

      {validationError && !isValidShowName && (
        <p className="text-red-500 text-xs">{validationError}</p>
      )}

      {currentShow.name && !showAddAsNewShow && (
        <div
          className={cn(
            `
              rounded-full
              bg-primary
              cursor-pointer
              text-xs
              p-1
              px-3
            `
          )}
          onClick={
            () =>
              currentShow.path
                ?
                handleMoveToCurrentShowClick()
                :
                handleSubmitNewShow()
          }
        >
          {
            currentShow.path
              ?
              `Move to ${currentShow.name}`
              :
              currentShow.name
          }
        </div>
      )}

      {
        !currentShow.name && showAddAsNewShow && (
          <div
            className={cn(
              `
                rounded-full
                bg-primary
                cursor-pointer
                text-xs
                p-1
                px-3
              `
            )}
            onClick={handleSubmitNewShow}
          >
            Add Show...
          </div>
        )
      }
    </>
  );
};
