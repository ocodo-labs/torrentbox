import { ModalOverlay } from '@/components/modal/modal-overlay';
import { TrendingListOrdering } from '@/components/trending-list-ordering';
import { listingOrdered } from '@/lib/sort-by-name';
import { modalErrorState, modalItemsList } from '@/lib/styling';
import { useState } from 'react';
import { ModalHeader } from '@/components/modal/modal-header';
import { useTrendingWeekContext } from '@/contexts/trending-week-context';
import { TrendingUp } from 'lucide-react';
import { MediaListItem } from '@/components/listing-modals/media-list-item';
import { MediaListLoadingView } from '@/components/listing-modals/media-list-loading-view';

export function TrendingWeekModal() {
  const { isOpen, close, listing, loading, error } = useTrendingWeekContext();
  const [isOrdered, setIsOrdered] = useState<boolean>(false)

  return (
    <ModalOverlay isOpen={isOpen} onClose={close}>
      <>
        {
          (loading && listing.length == 0) ||
          <ModalHeader title='Trending 7 Days'>
            <TrendingListOrdering
              isOrdered={isOrdered}
              setIsOrdered={setIsOrdered}
            />
          </ModalHeader>
        }
        {
          loading && listing.length == 0 &&
          <MediaListLoadingView
            title='Trending 7 Days'
            icon={<TrendingUp className='w-12 h-12' />} />
        }
        {
          error &&
          <div className={modalErrorState}>{error}</div>
        }
        <div className={modalItemsList}>
          {listing.length > 0 && listingOrdered(isOrdered, listing).map((media) => (
            <MediaListItem key={media.href} media={media} />
          ))}
        </div>
      </>
    </ModalOverlay>
  );
}


