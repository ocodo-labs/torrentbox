import { HeadphonesIcon } from "lucide-react"
import { AsyncJobLongPressTooltipButton } from "@/components/long-press-tooltip-button"
import { thinIconStyle } from "@/lib/styling"
import type { FC } from "react"
import { useTransmissionContext } from "@/contexts/transmission-provider"
import type { MoveToStorageProps } from "@/types/torrent"

export const MusicToStorage: FC<MoveToStorageProps> = ({ setMoveType, moveType, fileMoving, setFileMoving, file }) => {
  const { handleAction } = useTransmissionContext()

  if (fileMoving && moveType != 'music') return;

  return (<AsyncJobLongPressTooltipButton
    title="Move to Music"
    fillColor="bg-primary"
    icon={
      <HeadphonesIcon
        className="h-4 w-4 cursor-pointer"
        style={thinIconStyle}
      />
    }
    onLongPress={async () => {
      setFileMoving(true);
      setMoveType('music');
      await handleAction(file, "files/move/music")
      setFileMoving(false);
      setMoveType(undefined);
    }}
  />)
}
