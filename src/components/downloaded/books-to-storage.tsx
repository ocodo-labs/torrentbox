import { useTransmissionContext } from "@/contexts/transmission-provider"
import { thinIconStyle } from "@/lib/styling"
import { BookIcon } from "lucide-react"
import type { FC } from "react"
import { AsyncJobLongPressTooltipButton } from "@/components/long-press-tooltip-button";
import type { MoveToStorageProps } from "@/types/torrent";

export const BookToStorage: FC<MoveToStorageProps> = ({ setMoveType, moveType, fileMoving, setFileMoving, file }) => {
  const { handleAction } = useTransmissionContext();

  if (fileMoving && moveType != 'book') return;

  return (
    <AsyncJobLongPressTooltipButton
      title="Move to Books"
      fillColor="bg-primary"
      icon={
        <BookIcon
          className="h-4 w-4 cursor-pointer"
          style={thinIconStyle}
        />
      }
      onLongPress={async () => {
        setFileMoving(true);
        setMoveType('book');
        await handleAction(file, "files/move/books")
        setFileMoving(false);
        setMoveType(undefined);
      }}
    />
  )
}
