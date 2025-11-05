import { modalHeader, modalTitle } from "@/lib/styling"
import type { ReactNode, FC } from "react"

interface ModalHeaderProps {
  title: string
  children?: ReactNode
}

export const ModalHeader: FC<ModalHeaderProps> = ({ title, children }) => {
  return (
    <div className={modalHeader}>
      <div className={modalTitle}>{title}</div>
      {children}
    </div>
  )
}
