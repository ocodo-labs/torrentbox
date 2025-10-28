import { ModalOverlay } from '@/components/modal-overlay';
import { TrendingListOrdering } from '@/components/trending-list-ordering';
import { useTop100MoviesContext } from '@/contexts/top-100-movies-context';
import { listingOrdered } from '@/lib/sort-by-name';
import { modalErrorState, modalItemsList, thinIconStyle } from '@/lib/styling';
import { Film } from 'lucide-react';
import { useState } from 'react';
import { MediaListItem } from '@/components/media-list-item';
import { MediaListLoadingView } from '@/components/media-list-loading-view';
import { ModalHeader } from '@/components/modal-header';

export function Top100MoviesModal() {
  const { isOpen, close, listing, loading, error } = useTop100MoviesContext();
  const [isOrdered, setIsOrdered] = useState<boolean>(false)
  const title = 'Top 100 Movies'

  return (
    <ModalOverlay isOpen={isOpen} onClose={close}>
      <>
        {
          (loading && listingOrdered(isOrdered, listing).length == 0) ||
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
            icon={
              <Film
                className='w-12 h-12'
                style={thinIconStyle}
              />
            }
          />
        }
        {
          error &&
          <div className={modalErrorState}>{error}</div>
        }
        <div className={modalItemsList}>
          {listing.length > 0 && listingOrdered(isOrdered, listing).map((movie) => (
            <MediaListItem key={movie.href} media={movie} />
          ))}
        </div>
      </>
    </ModalOverlay>
  );
}
