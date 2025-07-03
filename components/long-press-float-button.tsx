import { FloatBox } from "@/components/float-box"
import { LongPressButton } from "@/components/long-press-button"
import { ReactNode } from "react"

interface LongPressFloatButtonProps {
  title: string
  icon: ReactNode
  fillColor?: string
  onLongPress: () => void
  vAlign?: 'top' | 'middle' | 'bottom'
  hAlign?: 'left' | 'center' | 'right'
}

export function LongPressFloatButton(props: LongPressFloatButtonProps) {

  const {
    title,
    icon,
    onLongPress,
    fillColor,
    vAlign = 'bottom',
    hAlign = 'center'} = props

  return (
    <FloatBox body={title} hAlign={hAlign} vAlign={vAlign}>
      <LongPressButton variant="ghost" size="icon" onLongPress={onLongPress} fillUpColorClass={fillColor} longPressDuration={1000}>
        {icon}
      </LongPressButton>
    </FloatBox>
  )
}
