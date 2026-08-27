import { useTransmissionContext } from "@/contexts/transmission-provider";
import { thinIconStyle } from "@/lib/styling";
import { Clapperboard } from "lucide-react";
import type { FC } from "react"
import { AsyncJobLongPressTooltipButton } from "../async-job-long-press-tooltip-button";
import type { MoveToStorageProps } from "@/types/torrent";

export const MoviesToStorage: FC<MoveToStorageProps> = ({ setMoveType, moveType, fileMoving, setFileMoving, file }) => {
  const { handleAction } = useTransmissionContext()

  if (fileMoving && moveType != 'movie') return;

  return (<AsyncJobLongPressTooltipButton
    title="Move to Movies"
    fillColor="bg-primary"
    icon={
      <Clapperboard
        className="h-4 w-4 cursor-pointer"
        style={thinIconStyle}
      />
    }
    onLongPress={async () => {
      setFileMoving(true);
      setMoveType('movie');
      await handleAction(file, "files/move/movies");
      setFileMoving(false);
      setMoveType(undefined);
    }}
  />)
};
