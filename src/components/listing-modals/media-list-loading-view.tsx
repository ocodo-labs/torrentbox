import { OcodoLoaderIcon } from "@/components/icons/ocodo-loader-icon"
import { modalLoadingState } from "@/lib/styling"
import { cloneElement, isValidElement, type FC, type ReactNode } from "react"

interface MediaListLoadingViewProps {
  icon: ReactNode
  title: string
}

export const MediaListLoadingView: FC<MediaListLoadingViewProps> = ({ icon, title }) => {
  return (
    <div className={modalLoadingState}>
      {isValidElement(icon) &&
        cloneElement(icon as React.ReactElement<{
          className: string,
          style: { strokeWidth: string }
        }>, {
          className: "w-32 h-32",
          style: { strokeWidth: '0.25px' },
        })}
      <div className='text-xs'>
        {title}
      </div>
      <OcodoLoaderIcon className="w-12 h-12 animate-spin" />
    </div>
  )
}
