import { TooltipCompact } from "@/components/tooltip-compact"
import { modalIconButton, thinIconStyle } from "@/lib/styling"
import { SortDesc, Star } from "lucide-react"
import type { FC } from "react"
import { toast } from "sonner"

interface TrendingListOrderingProps {
  isOrdered: boolean
  setIsOrdered: (newValue: boolean) => void
}

export const TrendingListOrdering: FC<TrendingListOrderingProps> = ({ isOrdered, setIsOrdered }) => {

  const sortedByName = 'Sorted by Name'
  const sortedByPopularity = 'Sorted by Popularity'

  return (
    <TooltipCompact tooltipChildren={isOrdered ? sortedByName : sortedByPopularity}>
      <div className={modalIconButton}>
        {
          isOrdered
            ?
            <SortDesc
              style={thinIconStyle}
              className='w-4 h-4'
              onClick={() => {
                setIsOrdered(false)
                toast(sortedByPopularity)
              }}
            />
            :
            <Star
              style={thinIconStyle}
              className='w-4 h-4'
              onClick={() => {
                setIsOrdered(true)
                toast(sortedByName)
              }}
            />
        }
      </div>
    </TooltipCompact>
  )
}
