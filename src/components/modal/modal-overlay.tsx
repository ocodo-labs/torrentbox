import { modalClose, modalContainer, modalContent, modalOverlay, thinIconStyle } from "@/lib/styling";
import { cn } from "@/lib/utils";
import { CircleX } from "lucide-react";

interface ModalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function ModalOverlay({ isOpen, onClose, children, className }: ModalOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className={modalOverlay} onClick={onClose}>
      <div className={modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={cn("flex flex-col", modalContent, className)}>
          <CircleX
            onClick={onClose}
            style={thinIconStyle}
            className={modalClose} />
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
