import { useState, useEffect, useRef, useCallback, Dispatch, SetStateAction } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface LongPressButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  children: React.ReactNode;
  fillUpColorClass?: string;
  longPressDuration: number;
  onLongPress: () => void;
  setPressing?: Dispatch<SetStateAction<boolean>>;
  transformOrigin?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

const LongPressButton: React.FC<LongPressButtonProps> = ({
  children,
  fillUpColorClass,
  longPressDuration,
  onLongPress,
  setPressing,
  transformOrigin = 'bottom',
  className,
  variant,
  size = 'default',
  ...rest
}) => {
  const [fillPercentage, setFillPercentage] = useState<number>(0);

  const isPressingRef = useRef<boolean>(false);
  const fillAnimationFrameId = useRef<number | null>(null);
  const drainAnimationFrameId = useRef<number | null>(null);
  const pressStartTime = useRef<number>(0);
  const drainStartTime = useRef<number>(0);
  const initialDrainFill = useRef<number>(0);

  const DRAIN_SPEED_MULTIPLIER = 4;

  const fillAnimation = useCallback((timestamp: DOMHighResTimeStamp) => {
    if (!isPressingRef.current) {
      if (fillAnimationFrameId.current !== null) {
        cancelAnimationFrame(fillAnimationFrameId.current);
        fillAnimationFrameId.current = null;
      }
      return;
    }

    const elapsedTime = timestamp - pressStartTime.current;
    const newPercentage = Math.min(100, (elapsedTime / longPressDuration) * 100);
    setFillPercentage(newPercentage);

    if (newPercentage < 100) {
      fillAnimationFrameId.current = requestAnimationFrame(fillAnimation);
    } else {
      if (fillAnimationFrameId.current !== null) {
        cancelAnimationFrame(fillAnimationFrameId.current);
      }
      fillAnimationFrameId.current = null;
      setFillPercentage(100);
      onLongPress();
    }
  }, [longPressDuration, onLongPress]);

  const drainAnimation = useCallback((timestamp: DOMHighResTimeStamp) => {
    if (fillPercentage <= 0) {
      if (drainAnimationFrameId.current !== null) {
        cancelAnimationFrame(drainAnimationFrameId.current);
      }
      drainAnimationFrameId.current = null;
      return;
    }

    const elapsedTime = timestamp - drainStartTime.current;
    const effectiveDrainDuration = (initialDrainFill.current / 100) * (longPressDuration / DRAIN_SPEED_MULTIPLIER);
    const newPercentage = Math.max(0, initialDrainFill.current - (elapsedTime / effectiveDrainDuration) * initialDrainFill.current);
    setFillPercentage(newPercentage);

    if (newPercentage > 0) {
      drainAnimationFrameId.current = requestAnimationFrame(drainAnimation);
    } else {
      if (drainAnimationFrameId.current !== null) {
        cancelAnimationFrame(drainAnimationFrameId.current);
      }
      drainAnimationFrameId.current = null;
      setFillPercentage(0);
    }
  }, [longPressDuration, fillPercentage]);

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault()

    if (rest.disabled || ('button' in e && e.button !== 0)) return;

    if (setPressing) setPressing(true)
    isPressingRef.current = true;
    pressStartTime.current = performance.now();

    if (fillAnimationFrameId.current !== null) {
      cancelAnimationFrame(fillAnimationFrameId.current);
      fillAnimationFrameId.current = null;
    }
    if (drainAnimationFrameId.current !== null) {
      cancelAnimationFrame(drainAnimationFrameId.current);
      drainAnimationFrameId.current = null;
    }

    setFillPercentage(0);
    fillAnimationFrameId.current = requestAnimationFrame(fillAnimation);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    if (rest.disabled) return;

    isPressingRef.current = false;
    if (setPressing) setPressing(false)

    if (fillAnimationFrameId.current !== null) {
      cancelAnimationFrame(fillAnimationFrameId.current);
      fillAnimationFrameId.current = null;
    }

    if (fillPercentage > 0 && fillPercentage < 100 && drainAnimationFrameId.current === null) {
      drainStartTime.current = performance.now();
      initialDrainFill.current = fillPercentage;
      drainAnimationFrameId.current = requestAnimationFrame(drainAnimation);
    }

    if (rest.onClick && fillPercentage < 100) {
      rest.onClick(e as React.MouseEvent<HTMLButtonElement>);
    }
  };

  const handleMouseLeave = () => {
    if (rest.disabled) return;

    if (isPressingRef.current) {
      isPressingRef.current = false;
      if (setPressing) setPressing(false)

      if (fillAnimationFrameId.current !== null) {
        cancelAnimationFrame(fillAnimationFrameId.current);
        fillAnimationFrameId.current = null;
      }

      if (fillPercentage > 0 && fillPercentage < 100 && drainAnimationFrameId.current === null) {
        drainStartTime.current = performance.now();
        initialDrainFill.current = fillPercentage;
        drainAnimationFrameId.current = requestAnimationFrame(drainAnimation);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (fillAnimationFrameId.current !== null) {
        cancelAnimationFrame(fillAnimationFrameId.current);
      }
      if (drainAnimationFrameId.current !== null) {
        cancelAnimationFrame(drainAnimationFrameId.current);
      }
    };
  }, []);

  return (
    <Button
      className={cn(
        `relative overflow-hidden group`, // Button itself is relative, creating a stacking context
        className
      )}
      variant={variant}
      size={size}
      {...rest}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      onTouchCancel={handleMouseLeave}
    >
      <div
        className={`absolute inset-0 ${fillUpColorClass || "bg-red-900"}`}
        style={{
          transform: `${transformOrigin == 'left' || transformOrigin == 'right' ? 'scaleX' : 'scaleY'}(${fillPercentage / 100})`,
          transformOrigin: transformOrigin,
        }}
      />

      {/* Content */}
      <div className="w-full p-6 relative z-[2] select-none">
        {children}
      </div>
    </Button>
  );
};

export default LongPressButton;
