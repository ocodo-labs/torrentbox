import { OcodoLoaderIcon } from "@/components/ocodo-loader-icon"
import { modalLoadingState } from "@/lib/styling"
import type { FC, ReactNode } from "react"

interface MediaListLoadingViewProps {
  icon: ReactNode
  title: string
}

export const MediaListLoadingView:FC<MediaListLoadingViewProps> = ({icon, title}) => {
  return (
    <div className={modalLoadingState}>
      {icon}
      <div className='text-xs'>
        {title}
      </div>
      <OcodoLoaderIcon className="w-12 h-12 animate-spin" />
    </div>
  )
}
