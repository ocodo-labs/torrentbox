import { FloatBox } from "@/components/float-box"
import { LongPressButton } from "@/components/long-press-button"
import { ReactNode } from "react"

interface LongPressFloatButtonProps {
  title: string
  icon: ReactNode
  onLongPress: () => void
}

export function LongPressFloatButton(props: LongPressFloatButtonProps) {

  const { title, icon, onLongPress } = props

  return (
    <FloatBox body={title} hAlign='center' vAlign='bottom'>
      <LongPressButton variant="ghost" size="icon" onLongPress={onLongPress} longPressDuration={1000}>
        {icon}
      </LongPressButton>
    </FloatBox>
  )
}
