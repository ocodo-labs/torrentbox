import { useEffect, useState } from "react"
import { CrtImage } from "@/components/listing-modals/crt-image";
import type { MediaListingItem } from "@/types/media-listing-interfaces";
import type { FC } from "react";
import { sleep } from "@/lib/utils";
interface MediaItemImageProps {
  media: MediaListingItem
}

export const MediaItemImage: FC<MediaItemImageProps> = ({ media }) => {
  const [renderImage, setRenderImage] = useState(!!media.imageUrl);
  const [containerVisible, setContainerVisible] = useState(!!media.imageUrl);

  const collapseDuration = 200;
  const crtDuration = 300;

  useEffect(() => {
    if (media.imageUrl) {
      setRenderImage(true);
      requestAnimationFrame(() => setContainerVisible(true));
    }
  }, [media.imageUrl]);

  if (!renderImage) return null;

  const handlePowerOff = async () => {
    await sleep(crtDuration);
    setContainerVisible(false);
    await sleep(collapseDuration);
    setRenderImage(false);
    if (media.setImageUrl) {
      media.setImageUrl(undefined);
    } else {
      media.imageUrl = undefined; 
    }
  }

  return (
    <div
      className={`
        relative transition-all duration-${collapseDuration}
        ${containerVisible ? "max-w-[180px] max-h-[300px]" : "max-h-0 max-w-0"}
      `}
    >
      <CrtImage
        src={media.imageUrl!}
        alt={media.name}
        duration={crtDuration}
        className="object-cover rounded-sm w-[180px]"
        onPowerOff={handlePowerOff}
      />
    </div>
  )
}
