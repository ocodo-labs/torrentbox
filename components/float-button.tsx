import { FloatBox } from "@/components/float-box"
import { Button } from "@/components/ui/button"
import { ReactNode } from "react"

interface FloatButtonProps {
  title: string
  icon: ReactNode
  vAlign?: 'top' | 'middle' | 'bottom'
  hAlign?: 'left' | 'center' | 'right'
  onClick: () => void
}

export function FloatButton(props: FloatButtonProps) {
  const {
    title,
    icon,
    vAlign = 'bottom',
    hAlign = 'center',
    onClick,
   } = props

  return (
    <FloatBox body={title} hAlign={hAlign} vAlign={vAlign}>
      <Button variant="ghost" size="icon" onClick={onClick}>
        {icon}
      </Button>
    </FloatBox>
  )
}
