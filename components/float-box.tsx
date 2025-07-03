import React, { useState, useRef } from "react";

interface ToolTipProps {
  postion: { top: number, left: number };
  body: React.ReactNode;
  shown: boolean;
}

const ToolTip: React.FC<ToolTipProps> = ({
  postion,
  body,
  shown
}) => (
  <div
    className={`
          dark:bg-gray-900 bg-slate-200 dark:text-white text-slate-900
           p-4 rounded-lg whitespace-nowrap
           absolute
           transition-opacity delay-200 duration-500
           ${shown ? "opacity-90" : "opacity-0"}
          `}
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

interface FloatBoxProps {
  body: React.ReactNode;
  hAlign: "left" | "center" | "right"
  vAlign: "top" | "middle" | "bottom"
  children: React.ReactNode;
  onClick?: () => void;
}

export const FloatBox: React.FC<FloatBoxProps> = ({
  hAlign,
  vAlign,
  children,
  body,
  onClick,
}) => {
  const [visible, setVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const targetRef = useRef<HTMLDivElement | null>(null);

  const xAlignment: number = {
    left: -2,
    center: 0.5,
    right: 2}[hAlign]

  const yAlignment: number = {
    top: 2,
    middle: 0.5,
    bottom: -2}[vAlign]

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
      className="inline-block"
    >
      {children}
      <ToolTip shown={visible} postion={tooltipPosition} body={body} />
    </div>
  );
};
