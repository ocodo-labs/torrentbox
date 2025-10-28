import { ModalOverlay } from '@/components/modal-overlay';
import { TrendingListOrdering } from '@/components/trending-list-ordering';
import { useTop100TVShowsContext } from '@/contexts/top-100-tvshows-context';
import { listingOrdered } from '@/lib/sort-by-name';
import { modalErrorState, modalItemsList, thinIconStyle } from '@/lib/styling';
import { Tv } from 'lucide-react';
import { useState } from 'react';
import { MediaListItem } from '@/components/media-list-item';
import { MediaListLoadingView } from '@/components/media-list-loading-view';
import { ModalHeader } from '@/components/modal-header';

export function Top100TVShowsModal() {
  const { isOpen, close, listing, loading, error } = useTop100TVShowsContext();
  const [isOrdered, setIsOrdered] = useState<boolean>(false)

  return (
    <ModalOverlay isOpen={isOpen} onClose={close}>
      <>
        {
          (loading && listing.length == 0) ||
          <ModalHeader title='Top 100 TV Shows'>
            <TrendingListOrdering
              isOrdered={isOrdered}
              setIsOrdered={setIsOrdered}
            />
          </ModalHeader>
        }
        {
          loading && listing.length == 0 &&
          <MediaListLoadingView
            title='Top 100 TV Shows'
            icon={
              <Tv
                style={thinIconStyle}
                className='w-12 h-12' />
            }
          />
        }
        {
          error &&
          <div className={modalErrorState}>{error}</div>
        }
        <div className={modalItemsList}>
          {listing.length > 0 && listingOrdered(isOrdered, listing).map((tvshow) => (
            <MediaListItem key={tvshow.href} media={tvshow} />
          ))}
        </div>
      </>
    </ModalOverlay>
  );
}


