import { StoragePathSelect } from "@/components/downloaded/storage-path-select"
import { TooltipCompact } from "@/components/tooltip-compact"
import { useStorage } from "@/contexts/storage-context"
import type { StorageNamePath } from "@/contexts/storage-provider"
import { useTransmissionContext } from "@/contexts/transmission-provider"
import { thinIconStyle } from "@/lib/styling"
import { validateNewShowName } from "@/lib/tv-show-validation"
import { cn } from "@/lib/utils"
import { Tv } from "lucide-react"
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

  // Handles moving the file to the selected show
  const handleMoveToCurrentShowClick = () => {
    const seriesPath = currentShow.path;
    setCurrentShow({} as StorageNamePath);  // Reset current show after action
    return handleAction(file, "files/move/tvshows", { 'tvseries': seriesPath });
  };

  // Handles the change in the input field for new show name
  const handleNewShowNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewShowName(value);

    const { isValid, error } = validateNewShowName(value, tvShows);
    setIsValidShowName(isValid);
    setValidationError(error);
  };

  // Handles when the user picks an existing show
  const handleShowSelection = (show: StorageNamePath) => {
    if (show.path === '') {
      // If it's an empty path, it means we're adding a new show, so show the input field
      setShowAddAsNewShow(true);
    } else {
      // Otherwise, we are selecting an existing show
      setCurrentShow(show);
      setShowAddAsNewShow(false);
    }
  };

  // Handles the submission of a new show name
  const handleSubmitNewShow = () => {
    // Handle new show submission with magic string (add:: prefix)
    if (isValidShowName && newShowName.trim() !== '') {
      const newShowPath = `add::${newShowName.trim()}`;  // Magic string for new paths
      setCurrentShow({ name: newShowName, path: newShowPath });  // Update current show with the new path
      setShowAddAsNewShow(false);  // Hide the input field after submission
      toast.success('New show added!');
    } else {
      toast.error(validationError || 'Please provide a valid show name.');
    }
  };

  return (
    <>
      <TooltipCompact tooltipChildren="Move to TV Show">
        <div className="rounded-full cursor-pointer p-2 hover:bg-foreground/20">
          <Tv
            className="h-4 w-4"
            style={thinIconStyle}
            onClick={() => {
              if (!showTVShows) {
                fetchTVShowList();
                setShowTVShows(true);
              } else {
                setShowTVShows(false);
                setShowAddAsNewShow(false);
                setCurrentShow({} as StorageNamePath);
              }
            }}
          />
        </div>
      </TooltipCompact>

      {/* Show existing TV shows or add new show */}
      {showTVShows && !showAddAsNewShow && !currentShow.name && (
        <StoragePathSelect
          selectLabel="Move to TV show..."
          items={[...tvShows, { name: 'Add new tv show...', path: '' }]}
          onPick={handleShowSelection}
        />
      )}

      {/* If we are adding a new show, show the input for the new name */}
      {showAddAsNewShow && !currentShow.path && (
        <div className={cn(`rounded-full bg-primary cursor-pointer text-xs p-1 px-3`)}>
          <input
            className="focus:outline-none focus:ring-0"
            value={newShowName}
            onChange={handleNewShowNameChange}
            placeholder="Enter new show name..."
          />
        </div>
      )}

      {/* Validation error message */}
      {validationError && !isValidShowName && (
        <p className="text-red-500 text-xs">{validationError}</p>
      )}

      {/* Show the "Move to TV Show" button only if an existing show is selected */}
      {currentShow.name && !showAddAsNewShow && (
        <div
          className={cn(`rounded-full bg-primary cursor-pointer text-xs p-1 px-3`)}
          onClick={() => currentShow.path ? handleMoveToCurrentShowClick() : handleSubmitNewShow()}
        >
          {currentShow.path ? `Move to ${currentShow.name}` : currentShow.name}
        </div>
      )}

      {/* If the user has selected a new show, we won't show the "Move to TV Show" button */}
      {!currentShow.name && showAddAsNewShow && (
        <div
          className={cn(`rounded-full bg-primary cursor-pointer text-xs p-1 px-3`)}
          onClick={handleSubmitNewShow}
        >
          Submit New Show
        </div>
      )}
    </>
  );
};
