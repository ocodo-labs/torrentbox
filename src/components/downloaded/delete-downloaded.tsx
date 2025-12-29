import { thinIconStyle } from "@/lib/styling"
import { Trash } from "lucide-react"
import type { FC } from "react"
import { LongPressTooltipButton } from "../long-press-tooltip-button"
import { useTransmissionContext } from "@/contexts/transmission-provider"

export const DeleteDownloaded: FC<{ file: string }> = ({ file }) => {
  const { handleAction } = useTransmissionContext()
  return (<LongPressTooltipButton
    title="Delete"
    icon={
      <Trash className="h-4 w-4 cursor-pointer" style={thinIconStyle} />
    }
    onLongPress={() => handleAction(file, "files/delete")}
  />
  )
}
