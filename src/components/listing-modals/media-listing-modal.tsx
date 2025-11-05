
import { MediaListItem } from "@/components/listing-modals/media-list-item"
import { MediaListLoadingView } from "@/components/listing-modals/media-list-loading-view"
import { ModalHeader } from "@/components/modal/modal-header"
import { ModalOverlay } from "@/components/modal/modal-overlay"
import { TrendingListOrdering } from "@/components/trending-list-ordering"
import type { MediaListingModalProps } from "@/contexts/media-listing-interfaces"
import { listingOrdered } from "@/lib/sort-by-name"
import { modalErrorState, modalItemsList } from "@/lib/styling"
import { type FC, useState } from "react"

export const MediaListingModal: FC<MediaListingModalProps> = ({
  title,
  icon,
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
          <ModalHeader title={title}>
            <TrendingListOrdering
              isOrdered={isOrdered}
              setIsOrdered={setIsOrdered}
            />
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
            <MediaListItem key={mediaItem.href} media={mediaItem} />
          ))}
        </div>
      </>
    </ModalOverlay>
  )
}
