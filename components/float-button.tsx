import { Button } from "@/components/ui/button"
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
      <Button variant="ghost" size="icon" onClick={onClick}>
        {icon}
      </Button>
    </TooltipCompact>
  )
}
