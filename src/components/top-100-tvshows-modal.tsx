import { ModalOverlay } from '@/components/modal-overlay';
import { OcodoLoaderIcon } from '@/components/ocodo-loader-icon';
import { useTop100TVShowsContext } from '@/contexts/top-100-tvshows-context';
import { useTransmissionContext } from '@/contexts/transmission-provider';
import { compare } from '@/lib/sort-by-name';
import { errorState, itemInfo, itemRow, itemsList, loadingState, modalClose, modalContent, modalHeader, modalTitle, thinIconStyle } from '@/lib/styling';
import { List, Magnet, SortDesc, Tv, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function Top100TVShowsModal() {
  const { isOpen, close, tvShows, loading, error, fetchTop100TVShowMagnet: fetchTop100TVShowMagnet } = useTop100TVShowsContext();
  const { addMagnet } = useTransmissionContext()
  const [isOrdered, setIsOrdered] = useState<boolean>(false)

  const listing = (ordered: Boolean) => {
    const list = Array.from(tvShows)

    return ordered
      ? list.sort(compare)
      : list
  }

  const addTop100Magnet = async (href: string) => {
    const magnet = await fetchTop100TVShowMagnet(href)
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
            <div className={modalTitle}>Top 100 TV Shows</div>
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
          loading && tvShows.length == 0 &&
          <div className={loadingState}>
            <Tv className="w-16 h-16" />
            <OcodoLoaderIcon className="w-12 h-12 animate-spin" />
          </div>
        }
        {
          error &&
          <div className={errorState}>{error}</div>
        }

        <div className={itemsList}>
          {tvShows.length > 0 && listing(isOrdered).map((tvshow) => (
            <div key={tvshow.href} className={itemRow}>
              <Magnet
                style={thinIconStyle}
                className='cursor-pointer'
                onClick={async () => {
                  toast(`Waiting for ${tvshow.name}`)
                  await addTop100Magnet(tvshow.href)
                  toast(`Added ${tvshow.name}`)
                }}
              />
              <div className={itemInfo}>
                {tvshow.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModalOverlay>
  );
}
