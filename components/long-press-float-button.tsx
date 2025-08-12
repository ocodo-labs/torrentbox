import { TooltipCompact } from "@/components/float-button"
import { LongPressButton } from "@/components/long-press-button"
import { OcodoLoaderIcon } from "@/components/ocodo-loader-icon"
import { useState, type FC, type ReactNode } from "react"

interface LongPressTooltipButtonProps {
  title: string
  icon: ReactNode
  fillColor?: string
  onLongPress: () => void
  vAlign?: 'top' | 'middle' | 'bottom'
  hAlign?: 'left' | 'center' | 'right'
}

type AsyncJobLongPressFloatButtonProps = Omit<LongPressTooltipButtonProps, 'onLongPress'> & {
  onLongPress: () => Promise<void>
}

export const AsycJobLongPressFloatButton: FC<AsyncJobLongPressFloatButtonProps> = ({ onLongPress, ...props }) => {
  const [isRunning, setIsRunning] = useState<boolean>(false)

  const handleLongPress = async () => {
    setIsRunning(true)

    try {
      await onLongPress()
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <>
      {isRunning ? (
        <div className="rounded-full p-2 bg-foreground/30">
          <OcodoLoaderIcon className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <LongPressTooltipButton onLongPress={handleLongPress} {...props} />
      )}
    </>
  )
}

export function LongPressTooltipButton(props: LongPressTooltipButtonProps) {

  const {
    title,
    icon,
    onLongPress,
    fillColor
  } = props

  return (
    <TooltipCompact tooltipChildren={title}>
      <LongPressButton onLongPress={onLongPress} fillUpColorClass={fillColor} longPressDuration={1000}>
        {icon}
      </LongPressButton>
    </TooltipCompact>
  )
}

