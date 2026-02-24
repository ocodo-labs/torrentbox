import { cn } from "@/lib/utils";
import type { ChangeEvent, FC } from "react";

interface TVShowAddAsNewShowType {
  newShowName: string;
  handleSubmitNewShow: () => void;
  handleNewShowNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const TVShowAddAsNewShow: FC<TVShowAddAsNewShowType> = ({
  newShowName,
  handleSubmitNewShow,
  handleNewShowNameChange
}) => {
  return (
    <div
      className={cn(
        `
          rounded-full
          bg-primary
          cursor-pointer
          text-xs
          p-1
          px-3
          transition-colors
        `,
        `
          focus-within:bg-primary/30
          focus-within:border-primary
          focus-within:border-2
        `
      )}
    >
      <input
        className={
          `
            bg-transparent
            focus:outline-none
            focus:ring-0
          `
        }
        value={newShowName}
        onChange={handleNewShowNameChange}
        placeholder="Enter new show name..."

        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSubmitNewShow();
          }
        }}
      />
    </div>
  )
}
