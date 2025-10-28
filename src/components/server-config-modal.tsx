import { ModalOverlay } from '@/components/modal-overlay';
import { modalErrorState, modalItemsList } from '@/lib/styling';
import { ModalHeader } from '@/components/modal-header';
import { useServerConfig } from '@/contexts/server-config-provider';
import { OcodoLoaderIcon } from '@/components/ocodo-loader-icon';
import { stringify } from 'yaml';

export function ServerConfigModal() {
  const { isOpen, close, config, loading, error } = useServerConfig();

  return (
    <ModalOverlay isOpen={isOpen} onClose={close} className='md:w-[90vw]'>
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
        <div className={modalItemsList} >
          <pre>
            {stringify(config)}
          </pre>
        </div>
      </>
    </ModalOverlay>
  );
}


