import type { FC } from "react"
import { LongPressAsyncJobTooltipButton } from "../async-job-long-press-tooltip-button"
import { Binary } from "lucide-react"
import { thinIconStyle } from "@/lib/styling"
import { useTransmissionContext } from "@/contexts/transmission-provider"
import type { MoveToStorageProps } from "@/types/torrent"

export const SoftwareToStorage: FC<MoveToStorageProps> = ({ file, setFileMoving, setMoveType, fileMoving, moveType }) => {
  const { handleAction } = useTransmissionContext()

  if (fileMoving && moveType != 'software') return;

  return (<LongPressAsyncJobTooltipButton
    title="Move to Software"
    fillColor="bg-primary"
    icon={
      <Binary
        className="h-4 w-4 cursor-pointer"
        style={thinIconStyle}
      />
    }

    onLongPress={async () => {
      setFileMoving(true);
      setMoveType('software');
      await handleAction(file, "files/move/software")
      setFileMoving(false);
      setMoveType(undefined);
    }}
  />)
}
