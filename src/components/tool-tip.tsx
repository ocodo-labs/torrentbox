import { cn } from "@/lib/utils";
import type { FC } from "react";

interface ToolTipProps {
  postion: { top: number, left: number };
  body: React.ReactNode;
  shown: boolean;
  className?: string;
}

export const ToolTip: FC<ToolTipProps> = ({
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
