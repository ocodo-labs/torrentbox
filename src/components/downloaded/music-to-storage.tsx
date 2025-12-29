import { HeadphonesIcon } from "lucide-react"
import { AsycJobLongPressTooltipButton } from "@/components/long-press-tooltip-button"
import { thinIconStyle } from "@/lib/styling"
import type { FC } from "react"
import { useTransmissionContext } from "@/contexts/transmission-provider"

export const MusicToStorage: FC<{ file: string }> = ({ file }) => {
  const { handleAction } = useTransmissionContext()

  return (
    <AsycJobLongPressTooltipButton
      title="Move to Music"
      fillColor="bg-primary"
      icon={
        <HeadphonesIcon
          className="h-4 w-4 cursor-pointer"
          style={thinIconStyle}
        />
      }
      onLongPress={() => handleAction(file, "files/move/music")}
    />
  )
}
