import { TooltipCompact } from "@/components/tooltip-compact"
import { modalIconButton, thinIconStyle } from "@/lib/styling"
import { SortDesc, Star } from "lucide-react"
import type { FC } from "react"

interface ListingOrderProps {
  isOrdered: boolean
  setIsOrdered: (newValue: boolean) => void
}

export const ListingsOrder: FC<ListingOrderProps> = ({ isOrdered, setIsOrdered }) => {
  return (
    <TooltipCompact tooltipChildren={isOrdered ? 'Sorted by Name' : 'Sorted by Popularity'}>
      <div className={modalIconButton}>
        {
          isOrdered
            ?
            <SortDesc
              style={thinIconStyle}
              className='w-4 h-4'
              onClick={() => setIsOrdered(!isOrdered)}
            />
            :
            <Star
              style={thinIconStyle}
              className='w-4 h-4'
              onClick={() => setIsOrdered(!isOrdered)}
            />
        }
      </div>
    </TooltipCompact>
  )
}
