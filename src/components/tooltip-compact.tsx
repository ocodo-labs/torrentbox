import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { ReactNode, FC } from "react"

interface TooltipCompactProps {
  children: ReactNode
  tooltipChildren: ReactNode
}

export const TooltipCompact: FC<TooltipCompactProps> = ({ children, tooltipChildren }) => {
  if (!tooltipChildren) {
    return children
  } else {
    return (
      <Tooltip>
        <TooltipContent>
          {tooltipChildren}
        </TooltipContent>
        <TooltipTrigger>
          {children}
        </TooltipTrigger>
      </Tooltip>
    )
  }
}

interface TooltipButtonProps {
  title: string
  icon: ReactNode
  className?: string
  onClick: () => void
}

export const TooltipButton: FC<TooltipButtonProps> = ({ title, icon, className, onClick }) => (
  <TooltipCompact tooltipChildren={title}>
    <div
      onClick={onClick}
      className={cn(`cursor-pointer p-2 rounded-full hover:bg-foreground/20 duration-500 transition-colors`, className)}>
      {icon}
    </div>
  </TooltipCompact>
)

