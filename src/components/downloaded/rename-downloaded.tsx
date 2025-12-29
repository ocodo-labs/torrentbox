import { useTransmissionContext } from "@/contexts/transmission-provider"
import { thinIconStyle } from "@/lib/styling"
import { Edit } from "lucide-react"
import type { FC } from "react"
import { TooltipButton } from "../tooltip-compact"

export const RenameDownloaded: FC<{ file: string }> = ({ file }) => {
  const { handleRenameDownloaded } = useTransmissionContext()

  return (
    <TooltipButton
      title="Rename"
      icon={
        <Edit
          className="h-4 w-4 cursor-pointer"
          style={thinIconStyle}
        />
      }
      onClick={() => handleRenameDownloaded(file)}
    />
  )
}
