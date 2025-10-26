import { ModalOverlay } from '@/components/modal-overlay';
import { OcodoLoaderIcon } from '@/components/ocodo-loader-icon';
import { TooltipCompact } from '@/components/tooltip-compact';
import { useTop100MoviesContext } from '@/contexts/top-100-movies-context';
import { useTransmissionContext } from '@/contexts/transmission-provider';
import { compare } from '@/lib/sort-by-name';
import { errorState, itemInfo, itemRow, itemsList, loadingState, modalClose, modalContent, modalHeader, modalTitle, thinIconStyle } from '@/lib/styling';
import { Circle, Film, List, Magnet, SortDesc, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function Top100MoviesModal() {
  const { isOpen, close, movies, loading, error, fetchTop100MovieMagnet } = useTop100MoviesContext();
  const { addMagnet } = useTransmissionContext()
  const [isOrdered, setIsOrdered] = useState<boolean>(false)

  const listing = (ordered: Boolean) => {
    const list = Array.from(movies)

    return ordered
      ? list.sort(compare)
      : list
  }
  const addTop100Magnet = async (href: string) => {
    const magnet = await fetchTop100MovieMagnet(href)
    if (magnet) {
      await addMagnet(magnet)
    } else {
      toast(`No magnet link for ${href}`)
    }
  }

  return (
    <ModalOverlay isOpen={isOpen} onClose={close}>
      <div className={modalContent}>
        <X onClick={close} className={modalClose} />
        {
          loading ||
          <div className={modalHeader}>
            <div className={modalTitle}>Top 100 Movies</div>
            <div className='cursor-pointer'>
              {
                isOrdered
                  ?
                  <SortDesc
                    style={thinIconStyle}
                    className='w-4 h-4'
                    onClick={() => setIsOrdered(!isOrdered)}
                  />
                  :
                  <List
                    style={thinIconStyle}
                    className='w-4 h-4'
                    onClick={() => setIsOrdered(!isOrdered)}
                  />
              }
            </div>
          </div>
        }

        {
          loading && movies.length == 0 &&
          <div className={loadingState}>
            <Film className="w-16 h-16" />
            <OcodoLoaderIcon className="w-12 h-12 animate-spin" />
          </div>
        }
        {
          error &&
          <div className={errorState}>{error}</div>
        }

        <div className={itemsList}>
          {movies.length > 0 && listing(isOrdered).map((movie) => (
            <div key={movie.href} className={itemRow}>
              {
                movie.existing.length > 0 &&
                <TooltipCompact tooltipChildren={`Existing Download: ${movie.existing}`}>
                  <Circle className="w-3 h-3" stroke="#AA6600" strokeWidth={3} />
                </TooltipCompact>
              }
              {
                movie.existing.length == 0 &&
                <Circle className="w-3 h-3" />
              }
              <Magnet
                style={thinIconStyle}
                className='cursor-pointer'
                onClick={async () => {
                  toast(`Waiting for ${movie.name}`)
                  await addTop100Magnet(movie.href)
                  toast(`Added ${movie.name}`)
                }}
              />
              <div className={itemInfo}>
                {movie.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModalOverlay>
  );
}
