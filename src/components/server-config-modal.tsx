import { ModalOverlay } from '@/components/modal/modal-overlay';
import { modalErrorState, modalItemsList } from '@/lib/styling';
import { ModalHeader } from '@/components/modal/modal-header';
import { useServerConfig } from '@/contexts/server-config-provider';
import { OcodoLoaderIcon } from '@/components/icons/ocodo-loader-icon';
import { stringify } from 'yaml';
import { Prism } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { cn } from '@/lib/utils';

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
        <div className={cn(modalItemsList, 'bg-[#111b27]')} >
          <Prism language='yaml' style={coldarkDark}>
            {stringify(config)}
          </Prism>
        </div>
      </>
    </ModalOverlay>
  );
}


