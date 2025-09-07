import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type Dispatch,
  type SetStateAction
} from 'react';
import { cn } from '@/lib/utils';

interface LongPressButtonProps {
  className?: string;
  childrenClassName?: string;
  fillUpColorClass?: string;
  transformOrigin?: 'top' | 'right' | 'bottom' | 'left';
  longPressDuration?: number;
  children: React.ReactNode;
  finishedDelay?: number;
  setPressing?: Dispatch<SetStateAction<boolean>>;
  onLongPress: () => void;
}

export const LongPressButton: React.FC<LongPressButtonProps> = ({
  children,
  childrenClassName,
  fillUpColorClass,
  finishedDelay = 500,
  longPressDuration = 500,
  onLongPress,
  setPressing,
  transformOrigin = 'bottom',
  className,
  ...rest
}) => {
  const [fillPercentage, setFillPercentage] = useState<number>(0);

  const isPressingRef = useRef<boolean>(false);
  const fillAnimationFrameId = useRef<number | undefined>(undefined);
  const drainAnimationFrameId = useRef<number | undefined>(undefined);
  const pressStartTime = useRef<number>(0);
  const drainStartTime = useRef<number>(0);
  const initialDrainFill = useRef<number>(0);

  const DRAIN_SPEED_MULTIPLIER = 4;

  const fillAnimation = useCallback((timestamp: DOMHighResTimeStamp) => {
    if (!isPressingRef.current) {
      if (fillAnimationFrameId.current !== undefined) {
        cancelAnimationFrame(fillAnimationFrameId.current);
        fillAnimationFrameId.current = undefined;
      }
      return;
    }

    const elapsedTime = timestamp - pressStartTime.current;
    const newPercentage = Math.min(100, (elapsedTime / longPressDuration) * 100);
    setFillPercentage(newPercentage);

    if (newPercentage < 100) {
      fillAnimationFrameId.current = requestAnimationFrame(fillAnimation);
    } else {
      if (fillAnimationFrameId.current !== undefined) {
        cancelAnimationFrame(fillAnimationFrameId.current);
      }
      fillAnimationFrameId.current = undefined;
      setTimeout(
        () => setFillPercentage(() => 0),
        200
      )
      onLongPress();
    }
  }, [longPressDuration, onLongPress]);

  const drainAnimation = useCallback((timestamp: DOMHighResTimeStamp) => {
    if (fillPercentage <= 0) {
      if (drainAnimationFrameId.current !== undefined) {
        cancelAnimationFrame(drainAnimationFrameId.current);
      }
      drainAnimationFrameId.current = undefined;
      return;
    }

    const elapsedTime = timestamp - drainStartTime.current;
    const effectiveDrainDuration = (initialDrainFill.current / 100) * (longPressDuration / DRAIN_SPEED_MULTIPLIER);
    const newPercentage = Math.max(0, initialDrainFill.current - (elapsedTime / effectiveDrainDuration) * initialDrainFill.current);
    setFillPercentage(newPercentage);

    if (newPercentage > 0) {
      drainAnimationFrameId.current = requestAnimationFrame(drainAnimation);
    } else {
      if (drainAnimationFrameId.current !== undefined) {
        cancelAnimationFrame(drainAnimationFrameId.current);
      }
      drainAnimationFrameId.current = undefined;
      setFillPercentage(0);
    }
  }, [longPressDuration, fillPercentage]);

  const handleMouseDown = () => {
    if (setPressing) setPressing(true)
    isPressingRef.current = true;
    pressStartTime.current = performance.now();

    if (fillAnimationFrameId.current !== undefined) {
      cancelAnimationFrame(fillAnimationFrameId.current);
      fillAnimationFrameId.current = undefined;
    }
    if (drainAnimationFrameId.current !== undefined) {
      cancelAnimationFrame(drainAnimationFrameId.current);
      drainAnimationFrameId.current = undefined;
    }

    setFillPercentage(0);
    fillAnimationFrameId.current = requestAnimationFrame(fillAnimation);
  };

  const handleMouseUp = () => {
    isPressingRef.current = false;
    if (setPressing) setPressing(false)

    if (fillAnimationFrameId.current !== undefined) {
      cancelAnimationFrame(fillAnimationFrameId.current);
      fillAnimationFrameId.current = undefined;
    }

    if (fillPercentage > 0 && fillPercentage < 100 && drainAnimationFrameId.current === undefined) {
      drainStartTime.current = performance.now();
      initialDrainFill.current = fillPercentage;
      drainAnimationFrameId.current = requestAnimationFrame(drainAnimation);
    }
  };

  const handleMouseLeave = () => {
    if (isPressingRef.current) {
      isPressingRef.current = false;
      if (setPressing) setPressing(false)

      if (fillAnimationFrameId.current !== undefined) {
        cancelAnimationFrame(fillAnimationFrameId.current);
        fillAnimationFrameId.current = undefined;
      }

      if (fillPercentage > 0 && fillPercentage < 100 && drainAnimationFrameId.current === undefined) {
        drainStartTime.current = performance.now();
        initialDrainFill.current = fillPercentage;
        drainAnimationFrameId.current = requestAnimationFrame(drainAnimation);
      }

      if (fillPercentage == 100) {
        setTimeout(() => setFillPercentage(0), finishedDelay)
      }
    }
  };

  useEffect(() => {
    return () => {
      if (fillAnimationFrameId.current !== undefined) {
        cancelAnimationFrame(fillAnimationFrameId.current);
      }
      if (drainAnimationFrameId.current !== undefined) {
        cancelAnimationFrame(drainAnimationFrameId.current);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        `relative overflow-hidden group cursor-pointer p-2 rounded-full hover:bg-foreground/20 duration-500 transition-colors`,
        className
      )}

      {...rest}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      onTouchCancel={handleMouseLeave}
    >
      <div
        className={`absolute p-2 inset-0 ${fillUpColorClass || "bg-red-900"}`}
        style={{
          transform: `${transformOrigin == 'left' || transformOrigin == 'right' ? 'scaleX' : 'scaleY'}(${fillPercentage / 100})`,
          transformOrigin: transformOrigin,
        }}
      />

      {/* Content */}
      <div className={
        cn(
          "relative z-[2] select-none",
          childrenClassName
        )
      }>
        {children}
      </div>
    </div>
  );
};
