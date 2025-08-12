import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { ReactNode, FC } from "react"

interface TooltipCompactProps {
  children: ReactNode
  tooltipChildren: ReactNode
}

export const TooltipCompact:FC<TooltipCompactProps> = ({children, tooltipChildren}) => {
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

interface TooltipButtonProps {
  title: string
  icon: ReactNode
  vAlign?: 'top' | 'middle' | 'bottom'
  hAlign?: 'left' | 'center' | 'right'
  onClick: () => void
}

export function TooltipButton(props: TooltipButtonProps) {
  const {
    title,
    icon,
    onClick,
   } = props

  return (
    <TooltipCompact tooltipChildren={title}>
      <div
      onClick={onClick}
      className="cursor-pointer p-2 rounded-full hover:bg-foreground/20 duration-500 transition-colors">
        {icon}
      </div>
    </TooltipCompact>
  )
}
