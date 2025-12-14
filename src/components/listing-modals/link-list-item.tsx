import { type MediaListingItem as LinkListingItem } from '@/types/media-listing-interfaces';
import { modalItemInfo, modalItemRow } from '@/lib/styling';
import type { FC } from 'react';

interface LinkListItemProps {
  link: LinkListingItem
}

export const LinkListItem: FC<LinkListItemProps> = ({ link }) => {
  const handleClick = () => {
    window.open(link.href, '_blank');
  };

  return (
    <div
      className={modalItemRow}
      onClick={handleClick}
      style={{ cursor: 'pointer' }} // shows pointer on hover
    >
      <span className={modalItemInfo}>{link.name}</span>
    </div>
  )
}
