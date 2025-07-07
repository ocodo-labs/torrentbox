import { FloatBox } from "@/components/float-box"
import { LongPressButton } from "@/components/long-press-button"
import { OcodoLoaderIcon } from "@/components/ocodo-loader-icon"
import { Button } from "@/components/ui/button"
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
        <Button size={'icon'} >
          <OcodoLoaderIcon className="w-4 h-4 animate-spin" />
        </Button>
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
    fillColor,
    vAlign = 'bottom',
    hAlign = 'center' } = props

  return (
    <FloatBox body={title} hAlign={hAlign} vAlign={vAlign}>
      <LongPressButton variant="ghost" size="icon" onLongPress={onLongPress} fillUpColorClass={fillColor} longPressDuration={1000}>
        {icon}
      </LongPressButton>
    </FloatBox>
  )
}

