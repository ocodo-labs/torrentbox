// components/modal-overlay.tsx
interface ModalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const overlay = "fixed inset-0 bg-background/80 backdrop-blur-sm z-50";
const container = "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2";

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
