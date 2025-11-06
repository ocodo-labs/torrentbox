import { modalHeader, modalTitle } from "@/lib/styling"
import type { ReactNode, FC } from "react"

interface ModalHeaderProps {
  title: string
  icon?: ReactNode
  children?: ReactNode
}

export const ModalHeader: FC<ModalHeaderProps> = ({ icon, title, children }) => {
  return (
    <div className={modalHeader}>
      {icon}
      <div className={modalTitle}>{title}</div>
      {children}
    </div>
  )
}
