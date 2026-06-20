import { ModalOverlay } from '@/components/modal/modal-overlay';
import { modalErrorState, modalItemsList } from '@/lib/styling';
import { ModalHeader } from '@/components/modal/modal-header';
import { useServerConfig } from '@/contexts/server-config-provider';
import { OcodoLoaderIcon } from '@/components/icons/ocodo-loader-icon';
import { stringify } from 'yaml';
import { Prism } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { cn } from '@/lib/utils';
import { ProgressRing } from '@/components/progress-ring';
import { useStorage } from '@/contexts/storage-context';
import { useEffect } from 'react';
import type { StorageInfo } from '@/contexts/storage-provider';
import { Circle } from 'lucide-react';

export function ServerConfigModal() {
  const { isOpen, close, config, loading, error } = useServerConfig();
  const { fetchStorageInfo, storageInfo } = useStorage();

  useEffect(
    () => {
      fetchStorageInfo();
    }, []
  );

  return (
    <ModalOverlay isOpen={isOpen} onClose={close} className='md:w-[90vw]'>
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
            <div className='flex flex-row gap-4'>
              {
                storageInfo.map((i) => {
                  return <div className='flex flex-col gap-2'>
                    <ProgressRing
                      radius={60}
                      percentage={i.UsedPercent}
                      strokeBg="var(--primary)"
                      strokeFg="var(--destructive)"
                    />
                    <div className='text-xl'>{i.Mounted}</div>
                    <div className='text-sm'>{i.Avail} free</div>
                  </div>
                })
              }
            </div>
          </>
        }
        {/*
        <div className={cn(modalItemsList, 'bg-[#111b27]')} >
          <Prism language='yaml' style={coldarkDark}>
            {stringify(config)}
          </Prism>
        </div>
*/}
      </>
    </ModalOverlay>
  );
}


