// components/modal-overlay.tsx
interface ModalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const overlay = "fixed inset-0 bg-background/80 backdrop-blur-sm z-50";
const container = `
  fixed inset-0
  md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2
  md:inset-auto
  w-[100vw] h-[100vh] sm:w-auto sm:h-auto
  flex items-center justify-center
`;

export function ModalOverlay({ isOpen, onClose, children }: ModalOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className={overlay} onClick={onClose}>
      <div className={container} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
