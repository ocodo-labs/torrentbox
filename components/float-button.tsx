import { FloatBox } from "@/components/float-box"
import { Button } from "@/components/ui/button"
import { ReactNode } from "react"

interface FloatButtonProps {
  title: string
  icon: ReactNode
  onClick: () => void
}

export function FloatButton(props: FloatButtonProps) {
  const { title, icon, onClick } = props

  return (
    <FloatBox body={title} hAlign='center' vAlign='bottom'>
      <Button variant="ghost" size="icon" onClick={onClick}>
        {icon}
      </Button>
    </FloatBox>
  )
}
