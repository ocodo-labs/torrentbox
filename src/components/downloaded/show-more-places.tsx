import { thinIconStyle } from "@/lib/styling"
import { Ellipsis } from "lucide-react"
import { TooltipButton } from "../tooltip-compact"
import type { FC } from "react"

export const ShowMorePlaces:FC<{onClick: () => void}> = ({onClick}) => {
  return (<TooltipButton
    title="Show More places"
    icon={
      <Ellipsis
        className="h-4 w-4 cursor-pointer"
        style={thinIconStyle}
      />
    }
    onClick={onClick}
  />)
}
