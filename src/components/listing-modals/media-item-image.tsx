import { CrtImage } from "@/components/listing-modals/crt-image"
import type { MediaListingItem } from "@/types/media-listing-interfaces"
import type { FC } from "react"

interface MediaItemImageProps {
  media: MediaListingItem
}

export const MediaItemImage: FC<MediaItemImageProps> = ({ media }) => {
  if (!media.imageUrl) {
    return null
  }

  return (
    <div className='relative'>
      <CrtImage
        duration={600}
        onPowerOff={() => media.imageUrl = undefined}
        src={media.imageUrl}
        alt={media.name}
        className='object-cover rounded-sm w-[100px]'
      />
    </div>
  )
}
