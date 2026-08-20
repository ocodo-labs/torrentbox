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
          loading || <ModalHeader title='Server Storage' />
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
            <div className='flex flex-row gap-10 items-center justify-center'>
              {
                storageInfo.map((i) => {
                  return <div className='flex flex-col gap-2 justify-center items-center'>
                    <ProgressRing
                      radius={50}
                      percentage={i.UsedPercent}
                      strokeBg="var(--primary)"
                      strokeFg="var(--destructive)"
                      strokeWidth={30}
                    />
                    <div className='mt-4'>{i.Mounted}</div>
                    <div className='text-xs '>{i.Avail} free</div>
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


