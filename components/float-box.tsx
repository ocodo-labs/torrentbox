import { cn } from "@/lib/utils";
import React, { useState, useRef } from "react";

interface ToolTipProps {
  postion: { top: number, left: number };
  body: React.ReactNode;
  shown: boolean;
  className?: string;
}

const ToolTip: React.FC<ToolTipProps> = ({
  className = "",
  postion,
  body,
  shown
}) => (
  <div
    className={cn(`
          dark:bg-gray-900 bg-slate-200 dark:text-white text-slate-900
           p-4 rounded-lg whitespace-nowrap
           absolute
           transition-opacity delay-200 duration-500
           ${shown ? "opacity-90" : "opacity-0"}
          `, className)}
    style={{
      top: postion.top,
      left: postion.left,
      transform: "translateX(-50%)",
      zIndex: 9999,
      pointerEvents: "none",
      border: "1px",
    }}
  >
    {body}
  </div>
)

type HAlignType = "left" | "center" | "right"
type VAlignType = "top" | "middle" | "bottom"

interface FloatBoxProps {
  body: React.ReactNode
  hAlign: HAlignType | number
  vAlign: VAlignType | number
  children: React.ReactNode
  popUpOnTap?: boolean
  className?: string
  onClick?: () => void
}

export const FloatBox: React.FC<FloatBoxProps> = ({
  hAlign,
  vAlign,
  children,
  body,
  popUpOnTap,
  className,
  onClick,
}) => {
  const [visible, setVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const targetRef = useRef<HTMLDivElement | null>(null);

  const hAlignKeyed = {
    left: -2,
    center: 0.5,
    right: 2
  }
  const vAlignKeyed = {
    top: 1,
    middle: 0.5,
    bottom: -1
  }

  const getXAlign = (x: HAlignType | number) => {
    if (typeof x == "number") return x
    return hAlignKeyed[x]
  }
  const getYAlign = (y: VAlignType | number) => {
    if (typeof y == "number") return y
    return vAlignKeyed[y]
  }

  const xAlignment: number = getXAlign(hAlign)
  const yAlignment: number = getYAlign(vAlign)

  const handleMouseEnter = () => {
    setVisible(true);
    if (targetRef.current) {
      const targetRect = targetRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: targetRect.top - (targetRect.height * yAlignment),
        left: targetRect.left + targetRect.width * xAlignment,
      });
    }
  };

  const handleMouseLeave = () => {
    setVisible(false);
  };

  return (
    <div
      ref={targetRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={onClick}
      onTouchStart={() => popUpOnTap && handleMouseEnter()}
      onTouchEnd={() => popUpOnTap ? handleMouseLeave() : onClick}
      className="inline-block"
    >
      {children}
      <ToolTip
        className={className}
        shown={visible}
        postion={tooltipPosition}
        body={body} />
    </div>
  );
};
