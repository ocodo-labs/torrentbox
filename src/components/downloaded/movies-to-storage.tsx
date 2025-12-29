import { useTransmissionContext } from "@/contexts/transmission-provider";
import { thinIconStyle } from "@/lib/styling";
import { Clapperboard } from "lucide-react";
import type { FC } from "react"
import { AsycJobLongPressTooltipButton } from "@/components/long-press-tooltip-button";

export const MoviesToStorage: FC<{ file: string }> = ({ file }) => {
  const { handleAction } = useTransmissionContext()

  return (<AsycJobLongPressTooltipButton
    title="Move to Movies"
    fillColor="bg-primary"
    icon={
      <Clapperboard
        className="h-4 w-4 cursor-pointer"
        style={thinIconStyle}
      />
    }
    onLongPress={() => handleAction(file, "files/move/movies")}
  />)
};
