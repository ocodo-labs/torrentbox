import { ModalOverlay } from '@/components/modal-overlay';
import { OcodoLoaderIcon } from '@/components/ocodo-loader-icon';
import { TooltipCompact } from '@/components/tooltip-compact';
import { useTop100MoviesContext } from '@/contexts/top-100-movies-context';
import { useTransmissionContext } from '@/contexts/transmission-provider';
import { thinIconStyle } from '@/lib/styling';
import { Circle, Magnet, X } from 'lucide-react';
import { toast } from 'sonner';

const modalContent = "bg-card rounded-lg p-6 w-full max-w-4xl relative";
const modalHeader = "flex justify-start items-center mb-4";
const modalTitle = "text-xl font-bold tracking-tighter";
const modalClose = "hover:bg-background rounded-full p-1 cursor-pointer absolute top-0 right-0";
const loadingState = "flex flex-row items-center justify-center py-4 w-full";
const errorState = "text-red-500 text-center py-4";
const moviesList = "grid gap-2  max-h-[80vh] overflow-y-auto";
const movieItem = "flex flex-row items-center justify-start gap-2";
const movieInfo = "flex items-center text-sm gap-2";

export function Top100MoviesModal() {
  const { isOpen, close, movies, loading, error, fetchTop100MovieMagnet } = useTop100MoviesContext();
  const { addMagnet } = useTransmissionContext()

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
        <div className={modalHeader}>
          <div className={modalTitle}>Top 100 Movies</div>
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

        <div className={moviesList}>
          {movies.length > 0 && movies.map((movie) => (
            <div key={movie.href} className={movieItem}>
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
              <div className={movieInfo}>
                {movie.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModalOverlay>
  );
}
