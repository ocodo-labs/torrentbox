import { LongPressButton } from "@/components/long-press-button"
import { OcodoLoaderIcon } from "@/components/ocodo-loader-icon"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { useState, type FC, type ReactNode } from "react"

interface LongPressFloatButtonProps {
  title: string
  icon: ReactNode
  fillColor?: string
  onLongPress: () => void
  vAlign?: 'top' | 'middle' | 'bottom'
  hAlign?: 'left' | 'center' | 'right'
}

type AsyncJobLongPressFloatButtonProps = Omit<LongPressFloatButtonProps, 'onLongPress'> & {
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
        <LongPressFloatButton onLongPress={handleLongPress} {...props} />
      )}
    </>
  )
}

export function LongPressFloatButton(props: LongPressFloatButtonProps) {

  const {
    title,
    icon,
    onLongPress,
    fillColor
  } = props

  return (
    <Tooltip>
      <TooltipTrigger>
        <LongPressButton variant="ghost" size="icon" onLongPress={onLongPress} fillUpColorClass={fillColor} longPressDuration={1000}>
          {icon}
        </LongPressButton>
      </TooltipTrigger>
      <TooltipContent>
        {title}
      </TooltipContent>
    </Tooltip>
  )
}

