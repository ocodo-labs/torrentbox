
import { MediaListItem } from "@/components/listing-modals/media-list-item"
import { MediaListLoadingView } from "@/components/listing-modals/media-list-loading-view"
import { ModalHeader } from "@/components/modal/modal-header"
import { ModalOverlay } from "@/components/modal/modal-overlay"
import { TrendingListOrdering } from "@/components/listing-modals/trending-list-ordering"
import type { MediaListingModalProps } from "@/types/media-listing-interfaces"
import { listingOrdered } from "@/lib/sort-by-name"
import { modalErrorState, modalItemsList, modalToolButton } from "@/lib/styling"
import { type FC, useState } from "react"
import { TooltipCompact } from "@/components/tooltip-compact"

export const MediaListingModal: FC<MediaListingModalProps> = ({
  title,
  icon,
  itemTools = [],
  listingTools = [],
  isOpen,
  close,
  listing,
  loading,
  error }) => {

  const [isOrdered, setIsOrdered] = useState<boolean>(false)

  return (
    <ModalOverlay isOpen={isOpen} onClose={close}>
      <>
        {
          (loading && listing.length == 0) ||
          <ModalHeader icon={icon} title={title}>
            <TrendingListOrdering
              isOrdered={isOrdered}
              setIsOrdered={setIsOrdered}
            />
            {
              listingTools.map((tool) => (
                <TooltipCompact key={tool.title} tooltipChildren={tool.title}>
                  <div
                    className={modalToolButton}
                    onClick={tool.action}>
                    {tool.icon}
                  </div>
                </TooltipCompact>
              ))
            }
          </ModalHeader>
        }
        {
          loading && listing.length == 0 &&
          <MediaListLoadingView
            title={title}
            icon={icon}
          />
        }
        {
          error &&
          <div className={modalErrorState}>{error}</div>
        }
        <div className={modalItemsList}>
          {listing.length > 0 && listingOrdered(isOrdered, listing).map((mediaItem) => (
            <MediaListItem key={mediaItem.href} media={mediaItem} tools={itemTools} />
          ))}
        </div>
      </>
    </ModalOverlay>
  )
}
