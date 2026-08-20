import { ModalOverlay } from '@/components/modal/modal-overlay';
import { modalErrorState } from '@/lib/styling';
import { ModalHeader } from '@/components/modal/modal-header';
import { useServerConfig } from '@/contexts/server-config-provider';
import { OcodoLoaderIcon } from '@/components/icons/ocodo-loader-icon';
import { ProgressRing } from '@/components/progress-ring';
import { useStorage } from '@/contexts/storage-context';
import { useEffect } from 'react';

export function ServerConfigModal() {
  const { isOpen, close, loading, error } = useServerConfig();
  const { fetchStorageInfo, storageInfo } = useStorage();

  useEffect(
    () => {
      fetchStorageInfo();
    }, []
  );

  return (
    <ModalOverlay isOpen={isOpen} onClose={close} >
      <>
        {
          loading || <ModalHeader title='Server Config' />
        }
        {
          loading &&
          <OcodoLoaderIcon className="w-12 h-12 animate-spin" />
        }
        {
          error && <div className={modalErrorState}>{error}</div>
        }

        {storageInfo.every(i => i.UsedPercent) &&
          <>
            <div className='flex flex-row gap-2 items-center justify-start'>
              <div className='text-md font-bold'>Server Storage</div>
              {
                storageInfo.map((i) => {
                  return <div className='flex flex-row gap-2 justify-start place-items-center'>
                    <div>
                      <ProgressRing
                        radius={12}
                        percentage={i.UsedPercent}
                        strokeBg="var(--primary)"
                        strokeFg="var(--destructive)"
                        strokeWidth={6}
                      />
                    </div>
                    <div className='flex flex-col gap-x-2'>
                      <div className='text-xxs mt-4'>{i.Mounted}</div>
                      <div className='text-xxs '>{i.Avail} free</div>
                    </div>
                  </div>
                })
              }
            </div>
          </>
        }
      </>
    </ModalOverlay>
  );
}


