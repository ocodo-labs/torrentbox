import { thinIconStyle } from "@/lib/styling";
import { ChevronRightIcon } from "lucide-react";
import type { FC } from "react";
import { TooltipButton } from "../tooltip-compact";

export const HideMorePlaces: FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <TooltipButton
      title="Close More places"
      icon={
        <ChevronRightIcon
          className="h-4 w-4 cursor-pointer"
          style={thinIconStyle}
        />
      }
      onClick={onClick}
    />
  )
}
