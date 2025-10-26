import { ModalOverlay } from '@/components/modal-overlay';
import { OcodoLoaderIcon } from '@/components/ocodo-loader-icon';
import { useTop100TVShowsContext } from '@/contexts/top-100-tvshows-context';
import { useTransmissionContext } from '@/contexts/transmission-provider';
import { thinIconStyle } from '@/lib/styling';
import { Magnet, X } from 'lucide-react';
import { toast } from 'sonner';

const modalContent = "bg-card rounded-lg p-6 w-full max-w-4xl relative";
const modalHeader = "flex justify-start items-center mb-4";
const modalTitle = "text-xl font-bold tracking-tighter";
const modalClose = "hover:bg-background rounded-full p-1 cursor-pointer absolute top-0 right-0";
const loadingState = "flex flex-row items-center justify-center py-4 w-full";
const errorState = "text-red-500 text-center py-4";
const showsList = "grid gap-2  max-h-[80vh] overflow-y-auto";
const showItem = "flex flex-row items-center justify-start gap-2";
const showInfo = "flex items-center text-sm gap-2";

export function Top100TVShowsModal() {
  const { isOpen, close, tvShows, loading, error, fetchTop100TVShowMagnet: fetchTop100TVShowMagnet } = useTop100TVShowsContext();
  const { addMagnet } = useTransmissionContext()

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
        <div className={modalHeader}>
          <div className={modalTitle}>Top 100 TV Shows</div>
        </div>

        {
          loading &&
          <div className={loadingState}>
            <OcodoLoaderIcon className="w-6 h-6 animate-spin" />
          </div>
        }
        {
          error &&
          <div className={errorState}>{error}</div>
        }

        <div className={showsList}>
          {tvShows.length > 0 && tvShows.map((tvshow) => (
            <div key={tvshow.href} className={showItem}>
              <Magnet
                style={thinIconStyle}
                className='cursor-pointer'
                onClick={async () => {
                  toast(`Waiting for ${tvshow.name}`)
                  await addTop100Magnet(tvshow.href)
                  toast(`Added ${tvshow.name}`)
                }}
              />
              <div className={showInfo}>
                {tvshow.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModalOverlay>
  );
}
