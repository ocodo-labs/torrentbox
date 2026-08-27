import { TooltipCompact } from "@/components/tooltip-compact"
import { LongPressButton } from "@/components/long-press-button"
import type { FC, ReactNode } from "react"

export interface LongPressTooltipButtonProps {
  title: ReactNode
  children: ReactNode
  duration?: number
  fillColor?: string
  onLongPress: () => void
  childrenClassName?: string
  className?: string
}

export const LongPressTooltipButton: FC<LongPressTooltipButtonProps> = ({
  title, children, onLongPress, fillColor, childrenClassName, className,
  duration = 1000
}) => (
  <TooltipCompact tooltipChildren={title} >
    <LongPressButton childrenClassName={childrenClassName} className={className} onLongPress={onLongPress} fillUpColorClass={fillColor} longPressDuration={duration}>
      {children}
    </LongPressButton>
  </TooltipCompact >
)
