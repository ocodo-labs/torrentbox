import { type MediaListingItem as LinkListingItem } from '@/types/media-listing-interfaces';
import { modalItemInfo, modalItemRow } from '@/lib/styling';
import type { FC } from 'react';

interface LinkListItemProps {
  link: LinkListingItem
}

export const LinkListItem: FC<LinkListItemProps> = ({ link }) => {
  return (
    <div className={modalItemRow}>
      <a className={modalItemInfo} href={link.href} target='_blank'>
        {link.name}
      </a>
    </div>
  )
}
