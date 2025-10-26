import { TooltipCompact } from "@/components/tooltip-compact"
import { LongPressButton } from "@/components/long-press-button"
import { OcodoLoaderIcon } from "@/components/ocodo-loader-icon"
import { useState, type FC, type ReactNode } from "react"

interface LongPressTooltipButtonProps {
  title: string
  icon: ReactNode
  duration?: number
  fillColor?: string
  onLongPress: () => void
  childrenClassName?: string
  className?: string
}

export const LongPressTooltipButton: FC<LongPressTooltipButtonProps> = ({
  title, icon, onLongPress, fillColor, childrenClassName, className,
  duration = 1000
}) => (
  <TooltipCompact tooltipChildren={title} >
    <LongPressButton childrenClassName={childrenClassName} className={className} onLongPress={onLongPress} fillUpColorClass={fillColor} longPressDuration={duration}>
      {icon}
    </LongPressButton>
  </TooltipCompact >
)

type AsyncJobLongPressTooltipButtonProps = Omit<LongPressTooltipButtonProps, 'onLongPress'> & {
  onLongPress: () => Promise<void>
}

export const AsycJobLongPressTooltipButton: FC<AsyncJobLongPressTooltipButtonProps> = ({ onLongPress, ...props }) => {
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
