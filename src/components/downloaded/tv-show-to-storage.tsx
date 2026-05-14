import React, { useState } from "react"
import type { FC } from "react"
import type { StorageNamePath } from "@/contexts/storage-provider"
import { StoragePathSelect } from "@/components/downloaded/storage-path-select"
import { TVShowAddAsNewShow } from "@/components/downloaded/tv-show-add-as-new-show"
import { TooltipCompact } from "@/components/tooltip-compact"
import { useStorage } from "@/contexts/storage-context"
import { useTransmissionContext } from "@/contexts/transmission-provider"
import { inputShowNameClasses, movingToShowIndicatorClasses, thinIconStyle } from "@/lib/styling"
import { validateNewShowName } from "@/lib/tv-show-validation"
import { CircleX, Tv } from "lucide-react"
import { toast } from "sonner"
import type { MoveToStorageProps } from "@/types/torrent"
import { OcodoLoaderIcon } from "@/components/icons/ocodo-loader-icon"

export const TVShowToStorage: FC<MoveToStorageProps> = ({ file, setFileMoving, fileMoving, setMoveType, moveType }) => {
  const { tvShows, fetchTVShowList } = useStorage();
  const { handleAction } = useTransmissionContext();
  const [showTVShows, setShowTVShows] = useState<boolean>(false);
  const [showAddAsNewShow, setShowAddAsNewShow] = useState<boolean>(false);
  const [inputShow, setInputShow] = useState<StorageNamePath>({} as StorageNamePath);
  const [newShowName, setNewShowName] = useState<string>('');
  const [isValidShowName, setIsValidShowName] = useState<boolean>(true);
  const [validationError, setValidationError] = useState<string | undefined>(undefined);
  const [existingShowName, setExistingShowName] = useState<string | undefined>(undefined);

  const handleMoveToExistingShowClick = async () => {
    const seriesName = inputShow.name;
    const pathName = inputShow.path;
    setExistingShowName(seriesName);
    setInputShow({} as StorageNamePath);
    setFileMoving(true);
    setMoveType('tv');
    await handleAction(file, "files/move/tvshows", {
      'X-TVSeries': seriesName,
      'X-TVSeriesPath': pathName
    });
    setMoveType(undefined);
    setFileMoving(false);
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
      setInputShow(show);
      setShowAddAsNewShow(false);
    }
  };

  const fetchAndShowTVSeriesList = () => {
    fetchTVShowList();
    setShowTVShows(true);
  }

  const hideTVSeriesList = () => {
    setShowTVShows(false);
    setShowAddAsNewShow(false);
    setInputShow({} as StorageNamePath);
  }

  const selectNewShowOrAddNew = () =>
    inputShow.path
      ? handleMoveToExistingShowClick()
      : inputShow.name
        ? handleSubmitNewShow()
        : setShowAddAsNewShow(true)

  const addNewShow = async (showName: string, path: string) => {
    await handleAction(file, "files/move/tvshows", {
      'X-TVSeries': showName,
      'X-TVSeriesPath': path,
      'X-TVSeriesNew': 'true',
    });

    toast(
      <div>
        <div>
          file: {file} moved to tv shows
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
      setInputShow({ name: newShowName, path: newShowPath });
      setShowAddAsNewShow(false);
      setMoveType('tv');
      setFileMoving(true);
      await addNewShow(newShowName, newShowPath)
      setFileMoving(false);
      setMoveType(undefined)
    } else {
      toast.error(validationError || 'Please provide a valid show name.');
    }
  };

  const MovingToIcon = () => (
    <OcodoLoaderIcon
      className="animate-spin"
      width={`16px`} height={`16px`} />
  )

  if (fileMoving && moveType != 'tv') return;

  return (
    <>
      <TooltipCompact tooltipChildren={showTVShows ? "Cancel move to TV Show" : "Move to TV Show"}>
        <div className="rounded-full cursor-pointer p-2 hover:bg-foreground/20">
          {
            !showTVShows
              ?
              <Tv
                onClick={fetchAndShowTVSeriesList}
                className="h-4 w-4"
                style={thinIconStyle}
              />
              :
              !fileMoving &&
              <CircleX
                onClick={hideTVSeriesList}
                className="h-4 w-4"
                style={thinIconStyle}
              />
          }
        </div>
      </TooltipCompact>

      {showTVShows && !showAddAsNewShow && !inputShow.name && !fileMoving && (
        <StoragePathSelect
          selectLabel="Move to TV show..."
          items={[...tvShows, { name: 'Add new tv show...', path: '' }]}
          onPick={handleShowSelection}
        />
      )}

      {showAddAsNewShow && !inputShow.path && !fileMoving && (
        <TVShowAddAsNewShow
          newShowName={newShowName}
          handleNewShowNameChange={handleNewShowNameChange}
          handleSubmitNewShow={handleSubmitNewShow}
        />
      )}

      {validationError && !isValidShowName && (
        <p className="text-red-500 text-xs">{validationError}</p>
      )}

      {fileMoving && moveType === 'tv' &&
        <>
          <div
            className={movingToShowIndicatorClasses}
          >
            {
              inputShow.name
                ?
                <>
                  <MovingToIcon /> Moving to {inputShow.name}
                </>
                :
                <>
                  <MovingToIcon /> Moving to {existingShowName}
                </>
            }
          </div>
        </>
      }

      {
        inputShow.name && !showAddAsNewShow && !fileMoving && (
          <div className={inputShowNameClasses} onClick={selectNewShowOrAddNew}>
            {inputShow.path ? `Move to ${inputShow.name}` : inputShow.name}
          </div>
        )
      }

      {
        !inputShow.name && showAddAsNewShow && !fileMoving && (
          <div
            className={inputShowNameClasses}
            onClick={handleSubmitNewShow}
          >
            Add Show...
          </div>
        )
      }
    </>
  );
};
