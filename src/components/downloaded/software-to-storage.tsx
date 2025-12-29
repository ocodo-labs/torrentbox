import type { FC } from "react"
import { AsycJobLongPressTooltipButton } from "@/components/long-press-tooltip-button"
import { Binary } from "lucide-react"
import { thinIconStyle } from "@/lib/styling"
import { useTransmissionContext } from "@/contexts/transmission-provider"

export const SoftwareToStorage: FC<{ file: string }> = ({ file }) => {
  const { handleAction } = useTransmissionContext()

  return (<AsycJobLongPressTooltipButton
    title="Move to Software"
    fillColor="bg-primary"
    icon={
      <Binary
        className="h-4 w-4 cursor-pointer"
        style={thinIconStyle}
      />
    }
    onLongPress={() => handleAction(file, "files/move/software")}
  />)
}
